import { Link } from "react-router-dom";
import { Bell, Dumbbell, Home, PersonStanding, Sparkles, StretchHorizontal } from "lucide-react";
import { workouts, liveClasses, user } from "@/data/mock";
import { instructors } from "@/data/mock";
import { Badge, Button, Card } from "@/components/ui/primitives";
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
      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 md:p-7">
            <Badge tone="amber">Pronto para hoje</Badge>
            <h1 className="mt-3 font-display text-2xl font-semibold md:text-3xl">Seu treino de hoje está pronto</h1>
            <p className="mt-1 text-lg text-stone-700">{today.name}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-600">
              <Badge>{today.durationMin} min</Badge>
              <Badge>{today.level}</Badge>
              <Badge tone="green">{today.calories} kcal estimadas</Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/treino/${today.id}/executar`}><Button>Começar treino</Button></Link>
              <Link to="/treinos"><Button variant="secondary">Trocar treino</Button></Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-100 to-amber-50 p-5">
            <p className="text-sm font-medium text-stone-600">Progresso semanal</p>
            <p className="mt-2 font-display text-3xl font-semibold">3 de 4</p>
            <p className="text-sm text-stone-600">treinos concluídos</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full w-3/4 rounded-full bg-[#6f8f4e]" />
            </div>
            <p className="mt-3 text-sm">Sequência atual: {user.streakDays} dias em movimento</p>
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
            <Link key={a.label} to={a.to} className="flex min-h-24 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-3 text-sm font-medium shadow-sm hover:border-orange-200">
              <a.icon size={18} className="text-[#e07a4a]" />
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionHeader title="Próxima aula ao vivo" />
          <Cover tone={next.tone} label={next.category} />
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
            <Link key={w.id} to={`/treinos/${w.id}`} className="w-56 shrink-0 rounded-2xl border border-stone-200 bg-white p-3">
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
