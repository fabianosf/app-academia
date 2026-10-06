import { Link } from "react-router-dom";
import { Activity, Bell, Clock3, Dumbbell, Flame, Home, Sparkles, StretchHorizontal } from "lucide-react";
import { workouts, liveClasses, user } from "@/data/mock";
import { instructors } from "@/data/mock";
import { Button, Card } from "@/components/ui/primitives";
import { SafetyNotice, SectionHeader } from "@/components/ShellBits";
import { Cover } from "@/components/Cards";
import { useApp } from "@/hooks/AppContext";

export function DashboardPage() {
  const today = workouts[0];
  const next = liveClasses.find((c) => c.status === "upcoming")!;
  const teacher = instructors.find((i) => i.id === next.instructorId);
  const { reserve, reservations, toggleReminder } = useApp();
  const reserved = reservations.some((r) => r.classId === next.id);
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-[#243a31] bg-[#243a31] text-white shadow-[0_14px_36px_rgba(36,58,49,0.12)]">
        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 md:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#d4dfd2]">
              <span className="h-2 w-2 rounded-full bg-[#d3a273]" />
              Seu plano de hoje
            </div>
            <h1 className="mt-4 max-w-xl font-display text-3xl font-semibold leading-tight text-white md:text-4xl">Seu treino de hoje está pronto</h1>
            <p className="mt-2 text-lg text-white/75">{today.name}</p>
            <div className="mt-6 grid max-w-lg grid-cols-3 border-t border-white/15 pt-4">
              <div className="pr-2">
                <p className="flex items-center gap-1.5 text-xs text-white/60"><Clock3 size={14} /> Duração</p>
                <p className="mt-1 text-sm font-semibold">{today.durationMin} min</p>
              </div>
              <div className="border-l border-white/15 px-3">
                <p className="flex items-center gap-1.5 text-xs text-white/60"><Activity size={14} /> Nível</p>
                <p className="mt-1 text-sm font-semibold">{today.level}</p>
              </div>
              <div className="border-l border-white/15 pl-3">
                <p className="flex items-center gap-1.5 text-xs text-white/60"><Flame size={14} /> Energia</p>
                <p className="mt-1 text-sm font-semibold">{today.calories} kcal</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/treino/${today.id}/executar`}><Button>Começar treino</Button></Link>
              <Link to="/treinos"><Button variant="secondary" className="border-white/20 bg-transparent text-white hover:bg-white/10">Trocar treino</Button></Link>
            </div>
          </div>
          <div className="flex flex-col justify-center bg-sage p-5 text-forest md:p-7">
            <p className="text-xs font-semibold uppercase text-[#617260]">Seu ritmo nesta semana</p>
            <p className="mt-3 font-display text-4xl font-semibold">3 <span className="text-2xl font-medium text-[#819080]">/ 4</span></p>
            <p className="mt-0.5 text-sm text-[#617260]">treinos concluídos</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full w-3/4 rounded-full bg-[#748b68]" />
            </div>
            <p className="mt-4 border-t border-[#d4ddd2] pt-3 text-sm text-[#526653]">Sequência de <span className="font-semibold text-forest">{user.streakDays} dias</span> em movimento</p>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title="Ações rápidas" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Treino rápido", icon: Dumbbell, to: "/treinos" },
            { label: "Treino em casa", icon: Home, to: "/treinos" },
            { label: "Treino de academia", icon: Dumbbell, to: "/treinos" },
            { label: "Alongamento", icon: StretchHorizontal, to: "/treinos/w8" },
            { label: "Falar com a Nina", icon: Sparkles, to: "/nina" },
          ].map((a) => (
            <Link key={a.label} to={a.to} className="group flex min-h-24 flex-col justify-between rounded-lg border border-stone-200/80 bg-white p-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-[#d9c6ba] hover:shadow-md">
              <a.icon size={18} className="text-[#a95335] transition-transform group-hover:scale-110" />
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionHeader title="Próxima aula ao vivo" />
          <Cover tone={next.tone} label={next.category} image="/images/strength-training.jpg" />
          <p className="mt-3 font-display text-lg font-semibold">{next.title}</p>
          <p className="text-sm text-stone-600">{next.category} · {next.date} às {next.time}</p>
          <p className="text-sm text-stone-500">{teacher?.name} · {next.participants} participantes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => reserve(next.id)}>{reserved ? "Vaga reservada" : "Reservar vaga"}</Button>
            <Button variant="secondary" onClick={() => toggleReminder(next.id)}><Bell size={16} /> Lembrete</Button>
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeader title="Insight da Nina" />
          <div className="flex gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-semibold text-[#c45d32]">Nina</div>
            <p className="text-sm leading-relaxed text-stone-700">Você treinou pernas ontem. Hoje, mobilidade e core podem ser uma boa escolha.</p>
          </div>
          <Link to="/nina" className="mt-4 inline-block"><Button>Montar treino com a Nina</Button></Link>
        </Card>
      </section>

      <section>
        <SectionHeader title="Recomendados para você" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {workouts.slice(0, 6).map((w) => (
            <Link key={w.id} to={`/treinos/${w.id}`} className="w-56 shrink-0 rounded-lg border border-stone-200/80 bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <Cover tone={w.tone} label={w.place} />
              <p className="mt-2 font-medium">{w.name}</p>
              <p className="text-xs text-stone-500">{w.durationMin} min · {w.level}</p>
            </Link>
          ))}
        </div>
      </section>
      <SafetyNotice>Este conteúdo é educativo e não substitui avaliação médica, fisioterapêutica ou de educação física. Interrompa se sentir dor, tontura ou mal-estar.</SafetyNotice>
    </div>
  );
}
