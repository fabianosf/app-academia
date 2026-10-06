import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Progress, Textarea } from "@/components/ui/primitives";
import { SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import type { Goal, Level, Place } from "@/types";

const steps = ["Objetivo", "Nível", "Local", "Frequência", "Tempo", "Equipamentos", "Cuidados", "Resumo"];
const goals: Goal[] = ["Emagrecer", "Ganhar massa muscular", "Condicionamento físico", "Mobilidade", "Saúde e bem-estar"];
const levels: Level[] = ["Iniciante", "Intermediário", "Avançado"];
const places: Place[] = ["Casa", "Academia", "Ambos"];
const freqs = [2, 3, 4, 5, 6];
const times = [15, 30, 45, 60];
const gear = ["Nenhum", "Colchonete", "Elástico", "Halteres", "Banco", "Barra", "Máquinas de academia"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, setProfile, setOnboarded } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(profile);

  const toggleGear = (item: string) => {
    setDraft((d) => ({ ...d, equipment: d.equipment.includes(item) ? d.equipment.filter((x) => x !== item) : [...d.equipment, item] }));
  };

  const finish = () => {
    setProfile(draft);
    setOnboarded(true);
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-stone-500">Etapa {step + 1} de {steps.length} · {steps[step]}</p>
      <div className="my-3"><Progress value={((step + 1) / steps.length) * 100} /></div>
      <Card className="p-5">
        {step === 0 && <Choice title="Qual é o seu objetivo agora?" options={goals} value={draft.goal} onPick={(goal) => setDraft({ ...draft, goal: goal as Goal })} />}
        {step === 1 && <Choice title="Como você se vê hoje?" options={levels} value={draft.level} onPick={(level) => setDraft({ ...draft, level: level as Level })} />}
        {step === 2 && <Choice title="Onde você pretende treinar?" options={places} value={draft.place} onPick={(place) => setDraft({ ...draft, place: place as Place })} />}
        {step === 3 && <Choice title="Quantos dias na semana?" options={freqs.map(String)} value={String(draft.weeklyFrequency)} onPick={(v) => setDraft({ ...draft, weeklyFrequency: Number(v) })} suffix=" dias" />}
        {step === 4 && <Choice title="Quanto tempo você tem por sessão?" options={times.map(String)} value={String(draft.sessionMinutes)} onPick={(v) => setDraft({ ...draft, sessionMinutes: Number(v) })} suffix=" minutos" />}
        {step === 5 && (
          <div>
            <h1 className="font-display text-xl font-semibold">Quais equipamentos você tem?</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {gear.map((g) => (
                <button key={g} onClick={() => toggleGear(g)} className={`rounded-full border px-3 py-2 text-sm ${draft.equipment.includes(g) ? "border-[#e07a4a] bg-orange-50" : "border-stone-200"}`}>{g}</button>
              ))}
            </div>
          </div>
        )}
        {step === 6 && (
          <div>
            <h1 className="font-display text-xl font-semibold">Limitações e cuidados</h1>
            <p className="mt-1 text-sm text-amber-900">Informe limitações, dores ou recomendações de profissionais de saúde.</p>
            <Textarea className="mt-3" rows={4} value={draft.limitations} onChange={(e) => setDraft({ ...draft, limitations: e.target.value })} placeholder="Ex.: desconforto no joelho direito ao agachar fundo." />
          </div>
        )}
        {step === 7 && (
          <div className="space-y-3">
            <h1 className="font-display text-xl font-semibold">Seu plano sugerido</h1>
            <p className="text-sm text-stone-600">{draft.goal} · {draft.level} · {draft.place} · {draft.weeklyFrequency}x por semana · {draft.sessionMinutes} min</p>
            <Card className="bg-orange-50 p-4">
              <p className="font-medium">Funcional equilibrado</p>
              <p className="text-sm text-stone-600">Três sessões de força e uma de mobilidade, ajustadas ao seu tempo e aos equipamentos informados.</p>
            </Card>
            <SafetyNotice>Este conteúdo é educativo e não substitui avaliação médica, fisioterapêutica ou de educação física.</SafetyNotice>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Voltar</Button>
          {step < 7 ? <Button onClick={() => setStep((s) => s + 1)}>Continuar</Button> : <Button onClick={finish}>Gerar meu plano</Button>}
        </div>
      </Card>
    </div>
  );
}

function Choice({ title, options, value, onPick, suffix = "" }: { title: string; options: string[]; value: string; onPick: (v: string) => void; suffix?: string }) {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold">{title}</h1>
      <div className="mt-4 grid gap-2">
        {options.map((opt) => (
          <button key={opt} onClick={() => onPick(opt)} className={`rounded-xl border px-4 py-3 text-left text-sm ${value === opt ? "border-[#e07a4a] bg-orange-50" : "border-stone-200 hover:bg-stone-50"}`}>{opt}{suffix}</button>
        ))}
      </div>
    </div>
  );
}
