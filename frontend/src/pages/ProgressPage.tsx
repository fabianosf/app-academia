import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { PageHeader, StatCard, EmptyState } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";

export function ProgressPage() {
  const {
    achievements,
    goals,
    history,
    loadLog,
    muscleProgress,
    weeklyFrequency,
    workouts,
    user,
  } = useApp();
  const empty = history.length === 0;
  const minutes = history.reduce((s, h) => s + h.minutes, 0);
  const kcal = history.reduce((s, h) => s + h.calories, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Progresso" subtitle="Consistência conta mais do que um treino perfeito." />
      {empty ? <EmptyState title="Seu histórico começa no primeiro treino" text="Quando você concluir uma sessão, minutos, sequência e metas aparecem aqui." /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Treinos no mês" value={String(history.length)} hint="meta 12" />
            <StatCard label="Minutos em movimento" value={String(minutes)} />
            <StatCard label="Sequência atual" value={`${user.streakDays} dias`} />
            <StatCard label="Calorias estimadas" value={String(kcal)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Chart title="Frequência semanal" dataKey="treinos" data={weeklyFrequency} />
            <Chart title="Minutos por dia" dataKey="minutos" data={weeklyFrequency} />
          </div>
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-display font-semibold">Evolução por grupo muscular</h2>
            <ul className="mt-3 space-y-2">
              {muscleProgress.map((m) => (
                <li key={m.group}>
                  <div className="flex justify-between text-sm"><span>{m.group}</span><span>{m.value}%</span></div>
                  <div className="h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#6f8f4e]" style={{ width: `${m.value}%` }} /></div>
                </li>
              ))}
            </ul>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-display font-semibold">Histórico recente</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {history.map((h) => {
                  const w = workouts.find((x) => x.id === h.workoutId);
                  return <li key={h.id} className="flex justify-between border-b border-stone-100 py-2"><span>{w?.name}</span><span className="text-stone-500">{h.date} · {h.minutes} min</span></li>;
                })}
              </ul>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-display font-semibold">Cargas na academia</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {loadLog.map((l) => <li key={l.exercise}><p className="font-medium">{l.exercise}</p><p className="text-stone-500">{l.last} · {l.note}</p></li>)}
              </ul>
            </div>
          </section>
          <section className="grid gap-3 md:grid-cols-3">
            {goals.map((g) => (
              <div key={g.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-sm font-medium">{g.label}</p>
                <p className="mt-1 text-sm text-stone-500">{g.current} de {g.target} {g.unit}</p>
                <div className="mt-2 h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#e07a4a]" style={{ width: `${(g.current / g.target) * 100}%` }} /></div>
              </div>
            ))}
          </section>
          <section className="grid gap-3 md:grid-cols-4">
            {achievements.map((a) => (
              <div key={a.id} className={`rounded-2xl border p-4 ${a.unlocked ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-white"}`}>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-stone-600">{a.description}</p>
                <p className="mt-2 text-xs">{a.unlocked ? "Conquistada" : "Em progresso"}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function Chart({
  title,
  dataKey,
  data,
}: {
  title: string;
  dataKey: "treinos" | "minutos";
  data: { day: string; treinos: number; minutos: number }[];
}) {
  return (
    <div className="h-64 rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="mb-2 font-display font-semibold">{title}</h2>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Bar dataKey={dataKey} fill="#e07a4a" radius={6} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
