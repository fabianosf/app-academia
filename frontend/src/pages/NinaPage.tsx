import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { askNina } from "@/services/aiAssistantService";
import type { AiChatMessage } from "@/types";
import { Button, Input } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import { ApiError } from "@/services/http";
import {
  createSpeechRecognition,
  ensureMicrophonePermission,
  isSecureVoiceContext,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeaking,
  unlockSpeechAudio,
  voiceCapabilityMessage,
  type SpeechRecognitionLike,
} from "@/services/ninaVoiceService";

const suggestions = [
  "Monte um treino para hoje",
  "Como faço agachamento?",
  "Adapte meu treino para casa",
  "Tenho apenas 20 minutos",
  "O que treinei esta semana?",
  "Quero melhorar meu condicionamento",
];

function apiErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    const body = err.body;
    if (typeof body === "object" && body && "detail" in body) {
      return String((body as { detail: string }).detail);
    }
  }
  return "Não consegui responder agora. Tente de novo em instantes.";
}

export function NinaPage() {
  const { profile, ninaNote, history, workouts } = useApp();
  const last = workouts.find((w) => w.id === history[0]?.workoutId);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content:
        "Oi, eu sou a Nina. Posso montar um treino curto, adaptar para casa ou explicar um movimento com calma — com o cérebro ANS (Academia Nutrição Saúde).",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [ansActive, setAnsActive] = useState(false);
  const [ansModel, setAnsModel] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sttSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();
  const secure = isSecureVoiceContext();
  const voiceHint = voiceCapabilityMessage();

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  const speakReply = useCallback(
    (content: string) => {
      if (!speakReplies || !ttsSupported) return;
      setSpeaking(true);
      speakText(content, { onEnd: () => setSpeaking(false) });
    },
    [speakReplies, ttsSupported],
  );

  const send = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      unlockSpeechAudio();
      recognitionRef.current?.stop();
      setListening(false);
      stopSpeaking();
      setSpeaking(false);

      const userMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: value,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setText("");
      setLoading(true);
      setError("");
      try {
        const res = await askNina({
          message: value,
          context: {
            goal: profile.goal,
            level: profile.level,
            lastWorkout: last?.name ?? "nenhum",
            equipment: profile.equipment,
          },
        });
        setMessages((m) => [...m, res.message]);
        if (res.knowledgeHash) {
          setAnsActive(true);
          setAnsModel(res.model ?? null);
        }
        speakReply(res.message.content);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [profile, last, speakReply],
  );

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startListening = async () => {
    unlockSpeechAudio();
    if (!secure) {
      setError(
        "Microfone bloqueado em HTTP. No celular use https://192.168.0.17:5173 e aceite o aviso de certificado.",
      );
      return;
    }
    if (!sttSupported) {
      setError(
        "Este navegador não tem ditado por voz (comum no iPhone). Digite a pergunta ou use Chrome no Android.",
      );
      return;
    }
    setError("");
    stopSpeaking();
    setSpeaking(false);

    const allowed = await ensureMicrophonePermission();
    if (!allowed) {
      setError("Permissão de microfone negada. Libere o microfone para este site.");
      return;
    }

    const recognition = createSpeechRecognition({
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onInterim: (partial) => setText(partial),
      onFinal: (finalText) => {
        setText(finalText);
        void send(finalText);
      },
      onError: (msg) => {
        setListening(false);
        setError(msg);
      },
    });
    if (!recognition) return;
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Não foi possível iniciar o microfone.");
      setListening(false);
    }
  };

  const toggleListen = () => {
    if (listening) stopListening();
    else void startListening();
  };

  const toggleSpeakReplies = () => {
    unlockSpeechAudio();
    if (speakReplies) {
      stopSpeaking();
      setSpeaking(false);
    }
    setSpeakReplies((v) => !v);
  };

  const replayMessage = (content: string) => {
    unlockSpeechAudio();
    setSpeaking(true);
    speakText(content, { onEnd: () => setSpeaking(false) });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid h-28 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-stone-100 text-sm text-stone-600">
          {ninaNote}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Personalize a aparência da Nina nas configurações administrativas.
        </p>
        <h2 className="mt-4 font-display text-xl font-semibold">Nina</h2>
        <p className="text-sm text-emerald-700">
          Online
          {listening ? " · ouvindo" : speaking ? " · falando" : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              ansActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {ansActive ? "ANS ativo" : "ANS pronto"}
          </span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-stone-500">Cérebro</dt>
            <dd>Academia Nutrição Saúde v1.0</dd>
          </div>
          {ansModel && (
            <div>
              <dt className="text-stone-500">Modelo</dt>
              <dd className="text-xs">{ansModel}</dd>
            </div>
          )}
          <div>
            <dt className="text-stone-500">Objetivo</dt>
            <dd>{profile.goal}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Nível</dt>
            <dd>{profile.level}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Último treino</dt>
            <dd>{last?.name}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Equipamentos</dt>
            <dd>{profile.equipment.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Voz</dt>
            <dd className="text-xs text-stone-600">
              {secure ? "HTTPS ok" : "Precisa HTTPS"}
              {" · "}
              {sttSupported ? "Ditado disponível" : "Ditado indisponível neste navegador"}
              {" · "}
              {ttsSupported ? "Respostas faladas disponíveis" : "Leitura em voz indisponível"}
            </dd>
          </div>
        </dl>
      </aside>
      <section className="flex min-h-[32rem] flex-col rounded-2xl border border-stone-200 bg-white p-4">
        <PageHeader
          title="Nina"
          subtitle="Assistente com cérebro ANS (saúde, nutrição e treino). Fale ou escreva."
        />
        {voiceHint && (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            {voiceHint}
          </p>
        )}
        {ansActive && (
          <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            Cérebro ANS ativado nesta conversa — respostas ancoradas em Academia Nutrição Saúde v1.0.
          </p>
        )}
        <div className="flex-1 space-y-3 overflow-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-auto bg-stone-900 text-white" : "bg-orange-50"
              }`}
            >
              <p>{m.content}</p>
              {m.role === "assistant" && ttsSupported && (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#b1603d]"
                  onClick={() => replayMessage(m.content)}
                >
                  <Volume2 size={12} /> Ouvir
                </button>
              )}
            </div>
          ))}
          {loading && <p className="text-sm text-stone-500">Nina está escrevendo…</p>}
          {listening && (
            <p className="text-sm font-medium text-[#b1603d]">Ouvindo… fale agora</p>
          )}
          {error && <p className="text-sm text-rose-700">{error}</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="rounded-full border border-stone-200 px-3 py-1 text-xs"
              onClick={() => {
                unlockSpeechAudio();
                void send(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <Input
            aria-label="Mensagem para Nina"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={listening ? "Ouvindo sua fala…" : "Escreva ou use o microfone"}
            className="min-w-[12rem] flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={toggleListen}
            aria-pressed={listening}
            disabled={loading || (!sttSupported && secure)}
            title={sttSupported ? "Falar com a Nina" : "Voz não suportada neste navegador"}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
            {listening ? "Parar" : "Voz"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={toggleSpeakReplies}
            aria-pressed={speakReplies}
            disabled={!ttsSupported}
            title="Ler respostas em voz alta"
            className="text-[#1d2a26] hover:bg-stone-100"
          >
            {speakReplies ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {speakReplies ? "Áudio on" : "Áudio off"}
          </Button>
          <Button type="submit" disabled={loading || !text.trim()}>
            Enviar
          </Button>
        </form>
        <div className="mt-3">
          <SafetyNotice>
            A Nina oferece orientação educativa. Não substitui médico, fisioterapeuta ou educador
            físico. No celular use HTTPS e, se a resposta não falar sozinha, toque em Ouvir.
          </SafetyNotice>
        </div>
      </section>
    </div>
  );
}
