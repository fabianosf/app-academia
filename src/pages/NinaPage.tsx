import { FormEvent, useState } from "react";
import { askNina } from "@/services/aiAssistantService";
import type { AiChatMessage } from "@/types";
import { Button, Input } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import { history, workouts } from "@/data/mock";

const suggestions = ["Monte um treino para hoje", "Como faço agachamento?", "Adapte meu treino para casa", "Tenho apenas 20 minutos", "O que treinei esta semana?", "Quero melhorar meu condicionamento"];

export function NinaPage() {
  const { profile, ninaNote } = useApp();
  const last = workouts.find((w) => w.id === history[0].workoutId);
  const [messages, setMessages] = useState<AiChatMessage[]>([{
    id: "m0",
    role: "assistant",
    content: "Oi, eu sou a Nina. Posso montar um treino curto, adaptar para casa ou explicar um movimento com calma.",
    createdAt: new Date().toISOString(),
  }]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  const send = async (value: string) => {
    if (!value.trim()) return;
    const userMsg: AiChatMessage = { id: crypto.randomUUID(), role: "user", content: value, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setLoading(true);
    setError("");
    try {
      const res = await askNina({ message: value, context: { goal: profile.goal, level: profile.level, lastWorkout: last?.name ?? "nenhum", equipment: profile.equipment } });
      setMessages((m) => [...m, res.message]);
    } catch {
      setError("Não consegui responder agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid h-28 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-stone-100 text-sm text-stone-600">{ninaNote}</div>
        <p className="mt-2 text-xs text-stone-500">Personalize a aparência da Nina nas configurações administrativas.</p>
        <h2 className="mt-4 font-display text-xl font-semibold">Nina</h2>
        <p className="text-sm text-emerald-700">Online</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div><dt className="text-stone-500">Objetivo</dt><dd>{profile.goal}</dd></div>
          <div><dt className="text-stone-500">Nível</dt><dd>{profile.level}</dd></div>
          <div><dt className="text-stone-500">Último treino</dt><dd>{last?.name}</dd></div>
          <div><dt className="text-stone-500">Equipamentos</dt><dd>{profile.equipment.join(", ")}</dd></div>
        </dl>
      </aside>
      <section className="flex min-h-[32rem] flex-col rounded-2xl border border-stone-200 bg-white p-4">
        <PageHeader title="Nina" subtitle="Assistente de treino e motivação. Técnica, simples e cuidadosa." />
        <div className="flex-1 space-y-3 overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-stone-900 text-white" : "bg-orange-50"}`}>{m.content}</div>
          ))}
          {loading && <p className="text-sm text-stone-500">Nina está escrevendo…</p>}
          {error && <p className="text-sm text-rose-700">{error}</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => <button key={s} className="rounded-full border border-stone-200 px-3 py-1 text-xs" onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e: FormEvent) => { e.preventDefault(); send(text); }}>
          <Input aria-label="Mensagem para Nina" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva para a Nina" />
          <Button type="button" variant="secondary" onClick={() => setListening((v) => !v)} aria-pressed={listening}>{listening ? "Ouvindo" : "Voz"}</Button>
          <Button type="submit">Enviar</Button>
        </form>
        <div className="mt-3"><SafetyNotice>A Nina oferece orientação educativa. Não substitui médico, fisioterapeuta ou educador físico.</SafetyNotice></div>
      </section>
    </div>
  );
}
