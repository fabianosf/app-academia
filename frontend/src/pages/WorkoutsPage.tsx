import { useMemo, useState } from "react";
import { WorkoutCard } from "@/components/Cards";
import { Input } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";

const filters = ["Casa", "Academia", "Corpo inteiro", "Pernas", "Glúteos", "Peito", "Costas", "Braços", "Core", "Cardio", "Mobilidade", "Iniciante", "Intermediário", "Avançado", "Até 20 minutos", "30 a 45 minutos", "Mais de 45 minutos"];

export function WorkoutsPage() {
  const { workouts } = useApp();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const toggle = (f: string) => setActive((a) => a.includes(f) ? a.filter((x) => x !== f) : [...a, f]);
  const list = useMemo(() => workouts.filter((w) => {
    const text = `${w.name} ${w.focus.join(" ")} ${w.place} ${w.level}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    return active.every((f) => {
      if (f === "Casa" || f === "Academia") return w.place === f;
      if (f === "Iniciante" || f === "Intermediário" || f === "Avançado") return w.level === f;
      if (f === "Até 20 minutos") return w.durationMin <= 20;
      if (f === "30 a 45 minutos") return w.durationMin >= 30 && w.durationMin <= 45;
      if (f === "Mais de 45 minutos") return w.durationMin > 45;
      return w.focus.some((x) => x.toLowerCase().includes(f.toLowerCase())) || w.muscles.some((x) => x.toLowerCase().includes(f.toLowerCase()));
    });
  }), [q, active, workouts]);

  return (
    <div>
      <PageHeader title="Treinos" subtitle="Escolha um plano guiado para casa, academia ou os dois." />
      <Input aria-label="Buscar treinos" placeholder="Buscar por nome ou foco" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button key={f} onClick={() => toggle(f)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${active.includes(f) ? "border-[#e07a4a] bg-orange-50 text-[#c45d32]" : "border-stone-200 bg-white"}`}>{f}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((w) => <WorkoutCard key={w.id} workout={w} />)}
      </div>
      {list.length === 0 && <p className="mt-8 text-sm text-stone-500">Nenhum treino com esses filtros. Tente ampliar a busca.</p>}
    </div>
  );
}
