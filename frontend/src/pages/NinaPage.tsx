import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { askNina } from "@/services/aiAssistantService";
import type { AiChatMessage } from "@/types";
import { Button, Input } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import { ApiError } from "@/services/http";
import {
  clarifyExerciseAssist,
  createExerciseAssist,
  sendAssistFeedback,
  type ExerciseAssistDto,
} from "@/services/api";
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

const chatSuggestions = [
  "Monte um treino para hoje",
  "Como faço agachamento?",
  "Adapte meu treino para casa",
  "Tenho apenas 20 minutos",
];

const exerciseSuggestions = [
  "Quero fortalecer os braços com halteres em casa.",
  "Como faço aquele de levantar os braços para os lados?",
  "Exercício para pernas, mas tenho desconforto no joelho.",
  "Mostra-me como se faz este movimento de empurrar.",
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

type Mode = "chat" | "exercise";

export function NinaPage() {
  const { profile, ninaNote, history, workouts } = useApp();
  const last = workouts.find((w) => w.id === history[0]?.workoutId);
  const [mode, setMode] = useState<Mode>("exercise");
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
  const [assist, setAssist] = useState<ExerciseAssistDto | null>(null);
  const [persona, setPersona] = useState<"neutral" | "woman" | "man">("neutral");
  const [pendingTranscript, setPendingTranscript] = useState(false);
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

  const sendChat = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      unlockSpeechAudio();
      recognitionRef.current?.stop();
      setListening(false);
      stopSpeaking();
      setSpeaking(false);
      setPendingTranscript(false);

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

  const sendExercise = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      unlockSpeechAudio();
      recognitionRef.current?.stop();
      setListening(false);
      stopSpeaking();
      setSpeaking(false);
      setPendingTranscript(false);
      setLoading(true);
      setError("");
      try {
        let result: ExerciseAssistDto;
        if (assist?.status === "clarifying") {
          result = await clarifyExerciseAssist(assist.id, {
            answer: value,
            persona,
            requestVideo: true,
          });
        } else {
          result = await createExerciseAssist({
            message: value,
            persona,
            requestVideo: true,
          });
        }
        setAssist(result);
        setText("");
        const speakParts = [
          result.clarifying_question || result.answer_text,
          result.steps?.length ? `Passos: ${result.steps.join(". ")}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        if (speakParts) speakReply(speakParts);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [assist, persona, speakReply],
  );

  const send = (value: string) => {
    if (mode === "chat") void sendChat(value);
    else void sendExercise(value);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startListening = async () => {
    unlockSpeechAudio();
    if (!secure) {
      setError(
        "Microfone bloqueado em HTTP. No celular use HTTPS e aceite o certificado.",
      );
      return;
    }
    if (!sttSupported) {
      setError(
        "Este navegador não tem ditado por voz. Digite o pedido ou use Chrome no Android.",
      );
      return;
    }
    setError("");
    stopSpeaking();
    setSpeaking(false);

    const allowed = await ensureMicrophonePermission();
    if (!allowed) {
      setError("Permissão de microfone negada.");
      return;
    }

    const recognition = createSpeechRecognition({
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onInterim: (partial) => setText(partial),
      onFinal: (finalText) => {
        setText(finalText);
        setPendingTranscript(true);
        // Não envia automaticamente — permite corrigir a transcrição.
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

  const latestJob = assist?.jobs?.[0] ?? null;
  const approvedDemo =
    assist?.matchedDemo?.status === "approved" ? assist.matchedDemo : null;
  const reviewDemo =
    latestJob?.demo?.status === "review" ? latestJob.demo : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid h-28 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-stone-100 text-sm text-stone-600">
          {ninaNote}
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold">Nina</h2>
        <p className="text-sm text-emerald-700">
          Online
          {listening ? " · ouvindo" : speaking ? " · falando" : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              mode === "exercise" ? "bg-[#1d2a26] text-white" : "bg-stone-100 text-stone-700"
            }`}
            onClick={() => setMode("exercise")}
          >
            Demonstrar exercício
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              mode === "chat" ? "bg-[#1d2a26] text-white" : "bg-stone-100 text-stone-700"
            }`}
            onClick={() => setMode("chat")}
          >
            Conversa ANS
          </button>
        </div>
        {mode === "exercise" && (
          <label className="mt-4 block text-xs text-stone-500">
            Pessoa na demonstração
            <select
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800"
              value={persona}
              onChange={(e) => setPersona(e.target.value as typeof persona)}
            >
              <option value="neutral">Automática / neutra</option>
              <option value="woman">Mulher</option>
              <option value="man">Homem</option>
            </select>
          </label>
        )}
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-stone-500">Perfil usado</dt>
            <dd className="text-xs text-stone-600">
              {profile.goal} · {profile.level} · {profile.equipment.join(", ") || "sem equipamento"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Voz</dt>
            <dd className="text-xs text-stone-600">
              {secure ? "HTTPS ok" : "Precisa HTTPS"} ·{" "}
              {sttSupported ? "Ditado disponível" : "Ditado indisponível"}
            </dd>
          </div>
        </dl>
      </aside>

      <section className="flex min-h-[32rem] flex-col rounded-2xl border border-stone-200 bg-white p-4">
        <PageHeader
          title="Nina"
          subtitle={
            mode === "exercise"
              ? "Descreve o movimento em linguagem comum ou fala — podes corrigir a transcrição antes de enviar."
              : "Assistente com cérebro ANS. Fale ou escreva."
          }
        />
        {voiceHint && (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            {voiceHint}
          </p>
        )}

        {mode === "chat" ? (
          <>
            {ansActive && (
              <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                Cérebro ANS ativado{ansModel ? ` · ${ansModel}` : ""}.
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
                  {m.content}
                </div>
              ))}
              {loading && <p className="text-sm text-stone-500">Nina está a escrever…</p>}
              {error && <p className="text-sm text-rose-700">{error}</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {chatSuggestions.map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-auto">
              {!assist && (
                <p className="rounded-2xl bg-orange-50 px-3 py-2 text-sm">
                  Explica o que queres com palavras do dia a dia. Não precisas do nome técnico.
                  Se a voz transcrever algo errado, corrige no campo antes de enviar.
                </p>
              )}
              {assist && (
                <div className="space-y-3 rounded-2xl border border-stone-100 bg-stone-50 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-stone-500">
                    Estado: {assist.status}
                    {assist.search_status ? ` · pesquisa: ${assist.search_status}` : ""}
                  </p>
                  {assist.personalized_from_profile && (
                    <p className="text-xs text-emerald-800">
                      Personalizei com base no teu perfil (objetivo/nível/equipamento).
                    </p>
                  )}
                  {assist.health_caution && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      Situação com cautela de saúde: informação geral apenas. Não diagnostico
                      nem prescrevo tratamento — procura um profissional habilitado.
                    </p>
                  )}
                  {assist.status === "clarifying" && assist.clarifying_question && (
                    <p className="font-medium text-[#b1603d]">{assist.clarifying_question}</p>
                  )}
                  {assist.answer_text && <p>{assist.answer_text}</p>}
                  {assist.interpretation?.exercise_name ? (
                    <p className="text-xs text-stone-600">
                      Entendi:{" "}
                      <strong>{String(assist.interpretation.exercise_name)}</strong>
                      {assist.interpretation.variation
                        ? ` (${String(assist.interpretation.variation)})`
                        : ""}
                      . Se não for isto, responde corrigindo.
                    </p>
                  ) : null}
                  {assist.steps?.length > 0 && (
                    <ol className="list-decimal space-y-1 pl-5">
                      {assist.steps.map((step, i) => (
                        <li key={`${i}-${step}`}>{step}</li>
                      ))}
                    </ol>
                  )}
                  {assist.cautions?.length > 0 && (
                    <ul className="space-y-1 text-xs text-stone-600">
                      {assist.cautions.map((c, i) => (
                        <li key={`${i}-${c}`}>• {c}</li>
                      ))}
                    </ul>
                  )}
                  {assist.sources?.length > 0 && (
                    <div className="text-xs">
                      <p className="font-medium text-stone-700">Fontes consultadas</p>
                      <ul className="mt-1 space-y-1">
                        {assist.sources.map((s) => (
                          <li key={s.url}>
                            <a
                              className="text-[#b1603d] underline"
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {s.title}
                            </a>
                            {s.authorship ? ` — ${s.authorship}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {approvedDemo?.media_url ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        Demonstração aprovada
                        {approvedDemo.ai_generated ? " · gerada por IA" : ""}
                      </p>
                      <video
                        className="max-h-64 w-full rounded-xl bg-black"
                        controls
                        src={approvedDemo.media_url}
                      >
                        O teu browser não reproduz vídeo. Segue os passos escritos.
                      </video>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-600">
                      {latestJob?.status === "not_configured" && (
                        <p>
                          Geração de vídeo ainda não está configurada neste ambiente. Usa os
                          passos escritos acima.
                          {latestJob.safe_error ? ` (${latestJob.safe_error})` : ""}
                        </p>
                      )}
                      {(latestJob?.status === "pending" ||
                        latestJob?.status === "processing") && (
                        <p>
                          Pedido de demonstração em processamento. Quando existir vídeo novo,
                          fica em revisão humana antes de aparecer aqui.
                        </p>
                      )}
                      {reviewDemo && (
                        <p>
                          Há um vídeo em revisão — ainda não é apresentado como demonstração
                          aprovada (pode conter erros biomecânicos).
                        </p>
                      )}
                      {!latestJob && !approvedDemo && assist.status === "answered" && (
                        <p>Sem demonstração em vídeo disponível de momento.</p>
                      )}
                    </div>
                  )}
                  {assist.status === "answered" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          void sendAssistFeedback({
                            assistRequestId: assist.id,
                            demoId: approvedDemo?.id,
                            useful: true,
                          }).then(() => setError("")).catch(() => setError("Não foi possível enviar feedback."))
                        }
                      >
                        Explicação útil
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          void sendAssistFeedback({
                            assistRequestId: assist.id,
                            useful: false,
                            preferShorter: true,
                          })
                        }
                      >
                        Preferia mais curta
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {loading && <p className="text-sm text-stone-500">A interpretar o teu pedido…</p>}
              {listening && (
                <p className="text-sm font-medium text-[#b1603d]">Ouvindo… fala agora</p>
              )}
              {pendingTranscript && text && (
                <p className="text-xs text-amber-900">
                  Transcrição pronta — corrige se precisares e toca em Enviar.
                </p>
              )}
              {error && <p className="text-sm text-rose-700">{error}</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {exerciseSuggestions.map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            send(text);
          }}
        >
          <Input
            aria-label="Mensagem para Nina"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (pendingTranscript) setPendingTranscript(true);
            }}
            placeholder={
              listening
                ? "Ouvindo…"
                : mode === "exercise"
                  ? "Escreve ou usa o microfone (podes editar antes de enviar)"
                  : "Escreve ou usa o microfone"
            }
            className="min-w-[12rem] flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={toggleListen}
            aria-pressed={listening}
            disabled={loading}
            title="Ditado por voz"
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
            {listening ? "Parar" : "Voz"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              unlockSpeechAudio();
              if (speakReplies) {
                stopSpeaking();
                setSpeaking(false);
              }
              setSpeakReplies((v) => !v);
            }}
            disabled={!ttsSupported}
          >
            {speakReplies ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
          <Button type="submit" disabled={loading || !text.trim()}>
            Enviar
          </Button>
        </form>
        <div className="mt-3">
          <SafetyNotice>
            Orientação educativa. Não substitui profissional de saúde ou educação física.
            Áudio de voz não é guardado — só a transcrição que envias. Vídeos gerados por IA
            só aparecem após aprovação.
          </SafetyNotice>
        </div>
      </section>
    </div>
  );
}
