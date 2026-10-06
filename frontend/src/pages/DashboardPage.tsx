import { Link } from "react-router-dom";
import { Activity, Bell, Clock3, Dumbbell, Flame, Home, Sparkles, StretchHorizontal } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { SafetyNotice, SectionHeader } from "@/components/ShellBits";
import { Cover } from "@/components/Cards";
import { useApp } from "@/hooks/AppContext";

export function DashboardPage() {
  const { workouts, liveClasses, instructors, user, reserve, reservations, toggleReminder, theme } = useApp();
  const today = workouts[0];
  const next = liveClasses.find((c) => c.status === "upcoming") ?? liveClasses[0];
  const teacher = instructors.find((i) => i.id === next?.instructorId);
  if (!today || !next) return <p className="text-sm text-stone-500">Carregando plano…</p>;
  const isDark = theme === "dark";
  const reserved = reservations.some((r) => r.classId === next.id);

  return (
    <div className="space-y-8">
      <Card className={isDark ? "overflow-hidden border-[#2d302f] bg-[linear-gradient(135deg,#171d1b_0%,#1d2925_30%,#1a2321_100%)] text-white shadow-[0_28px_64px_rgba(19,22,20,0.24)]" : "overflow-hidden border-[#e9dfd8] bg-[linear-gradient(135deg,#fefcfb_0%,#f4efe9_42%,#eef4ee_100%)] text-[#1d2a26] shadow-[0_28px_64px_rgba(19,22,20,0.08)]"}>
        <div className="grid gap-0 md:grid-cols-[1.3fr_0.7fr]">
          <div className="relative p-5 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,141,103,0.3),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(198,157,112,0.14),transparent_30%)]" />
            <div className="relative">
              <div className={isDark ? "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#efe1d4]" : "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7c665d]"}>
                <span className="h-2.5 w-2.5 rounded-full bg-[#d7a777] shadow-[0_0_16px_rgba(215,167,119,0.7)]" />
                Seu plano de hoje
              </div>
              <h1 className={isDark ? "mt-4 max-w-xl font-display text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-white md:text-5xl" : "mt-4 max-w-xl font-display text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#1d2a26] md:text-5xl"}>Seu treino de hoje está pronto</h1>
              <p className={isDark ? "mt-3 text-lg font-medium text-[#efe3da]" : "mt-3 text-lg font-medium text-[#3b4a42]"}>{today.name}</p>
              <div className={isDark ? "mt-6 grid max-w-lg grid-cols-3 border-t border-white/12 pt-4" : "mt-6 grid max-w-lg grid-cols-3 border-t border-[#d8d1ca] pt-4"}>
                <div className="pr-2">
                  <p className={isDark ? "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60" : "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#586960]"}><Clock3 size={13} /> Duração</p>
                  <p className={isDark ? "mt-1 text-sm font-semibold text-[#f8f4f2]" : "mt-1 text-sm font-semibold text-[#1d2a26]"}>{today.durationMin} min</p>
                </div>
                <div className={isDark ? "border-l border-white/12 px-3" : "border-l border-[#d8d1ca] px-3"}>
                  <p className={isDark ? "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60" : "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#586960]"}><Activity size={13} /> Nível</p>
                  <p className={isDark ? "mt-1 text-sm font-semibold text-[#f8f4f2]" : "mt-1 text-sm font-semibold text-[#1d2a26]"}>{today.level}</p>
                </div>
                <div className={isDark ? "border-l border-white/12 pl-3" : "border-l border-[#d8d1ca] pl-3"}>
                  <p className={isDark ? "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60" : "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#586960]"}><Flame size={13} /> Energia</p>
                  <p className={isDark ? "mt-1 text-sm font-semibold text-[#f8f4f2]" : "mt-1 text-sm font-semibold text-[#1d2a26]"}>{today.calories} kcal</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to={`/treino/${today.id}/executar`}><Button>Começar treino</Button></Link>
                <Link to="/treinos"><Button variant="secondary" className={isDark ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-[#d6c8bd] bg-white/80 text-[#1d2a26] hover:bg-white"}>Trocar treino</Button></Link>
              </div>
            </div>
          </div>
          <div className={isDark ? "flex flex-col justify-center bg-[linear-gradient(180deg,#f9f5f2_0%,#ebf0ea_100%)] p-5 text-[#23332d] md:p-7" : "flex flex-col justify-center bg-[linear-gradient(180deg,#fffdfb_0%,#edf3ee_100%)] p-5 text-[#23332d] md:p-7"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5d7566]">Seu ritmo nesta semana</p>
            <p className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-[#1d2a26]">3 <span className="text-2xl font-medium text-[#7f9081]">/ 4</span></p>
            <p className="mt-1 text-sm text-[#5b675d]">treinos concluídos</p>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/80">
              <div className="h-full w-3/4 rounded-full bg-[linear-gradient(90deg,#909f86_0%,#5f7a5e_100%)]" />
            </div>
            <p className="mt-4 border-t border-[#d7ddd3] pt-3 text-sm text-[#526653]">Sequência de <span className="font-semibold text-[#1f2c27]">{user.streakDays} dias</span> em movimento</p>
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
            <Link key={a.label} to={a.to} className={isDark ? "group flex min-h-24 flex-col justify-between rounded-[1.35rem] border border-[#2a312f] bg-[linear-gradient(180deg,rgba(30,35,33,0.96)_0%,rgba(18,22,21,0.96)_100%)] p-3 text-sm font-medium text-[#f1e7df] shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-1 hover:border-[#8f5a3f] hover:shadow-[0_18px_30px_rgba(0,0,0,0.24)]" : "group flex min-h-24 flex-col justify-between rounded-[1.35rem] border border-[#e7dfd8] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(246,240,235,0.95)_100%)] p-3 text-sm font-medium text-[#27342f] shadow-[0_10px_22px_rgba(35,32,28,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#d7bea9] hover:shadow-[0_18px_30px_rgba(52,42,38,0.08)]"}>
              <span className={isDark ? "grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#f0d2b6_0%,#d38a62_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]" : "grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#f7e6d9_0%,#edc6aa_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]"}>
                <a.icon size={18} className={isDark ? "text-[#2d201d] transition-transform group-hover:scale-110" : "text-[#9a5a3d] transition-transform group-hover:scale-110"} />
              </span>
              <span className={isDark ? "text-[#f1e7df]" : "text-[#27342f]"}>{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className={isDark ? "p-4" : "p-4 border-[#e7dfd8] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(247,242,236,0.95)_100%)]"}>
          <SectionHeader title="Próxima aula ao vivo" />
          <Cover tone={next.tone} label={next.category} image="/images/strength-training.jpg" />
          <p className={isDark ? "mt-3 font-display text-2xl font-semibold text-[#1d2a26]" : "mt-3 font-display text-2xl font-semibold text-[#1d2a26]"}>{next.title}</p>
          <p className={isDark ? "text-sm text-[#5e655f]" : "text-sm text-[#5e655f]"}>{next.category} · {next.date} às {next.time}</p>
          <p className={isDark ? "text-sm text-[#6d756e]" : "text-sm text-[#6d756e]"}>{teacher?.name} · {next.participants} participantes</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => reserve(next.id)}>{reserved ? "Vaga reservada" : "Reservar vaga"}</Button>
            <Button variant="secondary" onClick={() => toggleReminder(next.id)}><Bell size={16} /> Lembrete</Button>
          </div>
        </Card>
        <Card className={isDark ? "p-4" : "p-4 border-[#e7dfd8] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(247,242,236,0.95)_100%)]"}>
          <SectionHeader title="Insight da Nina" />
          <div className={isDark ? "flex gap-3 rounded-[1.25rem] bg-[#faf7f4] p-3" : "flex gap-3 rounded-[1.25rem] bg-[#f8f3ee] p-3"}>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f5d8c5_0%,#e7b38d_100%)] text-xs font-semibold text-[#8a4e36]">Nina</div>
            <p className={isDark ? "text-sm leading-relaxed text-[#4d5652]" : "text-sm leading-relaxed text-[#40504a]"}>Você treinou pernas ontem. Hoje, mobilidade e core podem ser uma boa escolha para equilibrar o volume.</p>
          </div>
          <Link to="/nina" className="mt-4 inline-block"><Button>Montar treino com a Nina</Button></Link>
        </Card>
      </section>

      <section>
        <SectionHeader title="Recomendados para você" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {workouts.slice(0, 6).map((w) => (
            <Link key={w.id} to={`/treinos/${w.id}`} className={isDark ? "w-56 shrink-0 rounded-[1.25rem] border border-[#e9dfd8] bg-white/80 p-3 shadow-[0_12px_22px_rgba(29,32,29,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_28px_rgba(28,38,33,0.08)]" : "w-56 shrink-0 rounded-[1.25rem] border border-[#e9dfd8] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(246,240,235,0.96)_100%)] p-3 shadow-[0_12px_22px_rgba(29,32,29,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_28px_rgba(28,38,33,0.08)]"}>
              <Cover tone={w.tone} label={w.place} />
              <p className="mt-2 font-medium text-[#1d2a26]">{w.name}</p>
              <p className="text-xs text-[#5d655f]">{w.durationMin} min · {w.level}</p>
            </Link>
          ))}
        </div>
      </section>
      <SafetyNotice>Este conteúdo é educativo e não substitui avaliação médica, fisioterapêutica ou de educação física. Interrompa se sentir dor, tontura ou mal-estar.</SafetyNotice>
    </div>
  );
}
