import { ArrowRight, BrainCircuit, Check, Dumbbell, PlayCircle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge, Button, Card } from "@/components/ui/primitives";

const metrics = [
  { label: "treinos adaptados", value: "7/7" },
  { label: "evolução em tempo real", value: "+28%" },
  { label: "sua rotina em 1 app", value: "24h" },
];

const valuePoints = [
  "Treino adaptado ao seu nível e tempo disponível.",
  "Foco em consistência, nem em excesso de informação.",
  "Orientação prática para evoluir sem virar rotina pesada.",
];

const benefits = [
  {
    icon: BrainCircuit,
    title: "IA que entende seu objetivo",
    description: "Nina monta a rotina com base no seu nível, tempo disponível e evolução real.",
  },
  {
    icon: Dumbbell,
    title: "Treino mais eficiente",
    description: "Sem excesso de informação. Sinais claros, exercícios certos e progresso mais consistente.",
  },
  {
    icon: TrendingUp,
    title: "Progresso observado",
    description: "Você acompanha métricas, evolução e ajustes inteligentes sem perder o foco no resultado.",
  },
];

const steps = [
  "Você informa objetivo, nível e disponibilidade.",
  "Nina ajusta treino e orientação com base no contexto.",
  "Você evolui com rotina clara e acompanhamento contínuo.",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(29,183,184,0.18),transparent_18%),radial-gradient(circle_at_90%_10%,rgba(6,28,43,0.18),transparent_20%),linear-gradient(180deg,#f7f9fb_0%,#eef3f5_100%)] text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] text-sm font-bold text-white shadow-[0_20px_32px_rgba(6,28,43,0.2)]">
            NC
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Nina Coach</p>
            <p className="font-display text-lg font-semibold text-slate-900">Treinar com inteligência.</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#beneficios" className="transition hover:text-slate-900">Benefícios</a>
          <a href="#como-funciona" className="transition hover:text-slate-900">Como funciona</a>
          <a href="#diferenciais" className="transition hover:text-slate-900">Diferenciais</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="secondary" className="rounded-xl border-slate-200 bg-white/70 text-slate-700 shadow-sm hover:bg-white">
              Entrar
            </Button>
          </Link>
          <Link to="/login">
            <Button className="rounded-xl bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] text-white shadow-[0_18px_36px_rgba(13,99,104,0.25)]">
              Começar agora
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-8 lg:px-8 lg:pt-12">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <Badge tone="neutral" className="border border-[#dfe9ee] bg-white/80 text-slate-700">
              IA de treino & acompanhamento
            </Badge>

            <h1 className="mt-6 max-w-xl font-display text-5xl leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-6xl">
              Treinar com inteligência.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Nina Coach é sua assistente de treino pensada para acompanhar seu progresso com clareza, personalização e consistência.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button className="rounded-xl bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] px-5 py-3 text-sm text-white shadow-[0_18px_32px_rgba(13,99,104,0.25)]">
                  Começar agora
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/landing#como-funciona">
                <Button variant="secondary" className="rounded-xl border-slate-200 bg-white/80 px-5 py-3 text-sm text-slate-700 shadow-sm">
                  <PlayCircle size={16} />
                  Ver como funciona
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {['Sem complicação', 'Treino adaptado', 'Progresso claro'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5">
                  <Check size={14} className="text-emerald-600" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            className="relative"
          >
            <Card className="relative overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(242,248,250,0.96)_100%)] p-5 shadow-[0_32px_64px_rgba(8,33,42,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo do dia</p>
                  <h2 className="mt-2 font-display text-2xl text-slate-900">Treino inteligente</h2>
                </div>
                <div className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  on
                </div>
              </div>

              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Foco</span>
                    <span>Força + mobilidade</span>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#061C2B_0%,#1DB7B8_100%)]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {metrics.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-[linear-gradient(135deg,#061C2B_0%,#0d2f42_35%,#1DB7B8_100%)] p-4 text-white shadow-[0_20px_32px_rgba(6,28,43,0.2)]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100">Nina recomendou</p>
                  <p className="mt-3 font-display text-2xl">Treino de força + mobilidade</p>
                  <p className="mt-2 text-sm text-cyan-50">Ajustado ao seu ritmo para melhorar consistência e reduzir esforço desnecessário.</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        <section className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="neutral" className="border border-slate-200 bg-white/70 text-slate-700">
              Prova de valor
            </Badge>
            <h2 className="mt-5 font-display text-4xl text-slate-950">Seu treino guiado por inteligência.</h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {valuePoints.map((point) => (
              <Card key={point} className="border border-slate-200 bg-white/80 p-5 text-left shadow-[0_20px_36px_rgba(15,23,42,0.04)]">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={16} />
                </div>
                <p className="text-base leading-relaxed text-slate-700">{point}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="beneficios" className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="neutral" className="border border-slate-200 bg-white/70 text-slate-700">
              Benefícios
            </Badge>
            <h2 className="mt-5 font-display text-4xl text-slate-950">Tudo o que você precisa para evoluir.</h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border border-slate-200 bg-white/70 p-5 shadow-[0_20px_36px_rgba(15,23,42,0.04)]">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] text-white shadow-[0_14px_24px_rgba(13,99,104,0.2)]">
                  <Icon size={18} />
                </div>
                <h3 className="font-display text-2xl text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="neutral" className="border border-slate-200 bg-white/70 text-slate-700">
              Como funciona
            </Badge>
            <h2 className="mt-5 font-display text-4xl text-slate-950">Clareza, rotina e evolução sem ruído.</h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step} className="relative border border-slate-200 bg-white/70 p-5 shadow-[0_20px_36px_rgba(15,23,42,0.04)]">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-base leading-relaxed text-slate-700">{step}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="diferenciais" className="mt-24">
          <Card className="border border-slate-200 bg-[linear-gradient(135deg,rgba(6,28,43,0.96)_0%,rgba(15,63,71,0.96)_50%,rgba(29,183,184,0.92)_100%)] p-8 text-white shadow-[0_30px_54px_rgba(6,28,43,0.18)] md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
              <div>
                <Badge tone="neutral" className="border border-white/10 bg-white/10 text-cyan-100">
                  Diferenciais
                </Badge>
                <h2 className="mt-5 font-display text-4xl leading-tight text-white">Mais inteligência. Mais consistência. Mais resultado.</h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-cyan-50/90">
                  Nina Coach combina orientação prática, clareza de rotina e acompanhamento inteligente para transformar o treino em uma experiência mais eficiente e sustentável.
                </p>
              </div>

              <div className="space-y-4 text-sm text-cyan-50/95">
                {[
                  "Acompanhamento personalizado em tempo real",
                  "Treinos adaptados ao seu nível e disponibilidade",
                  "Experiência simples, elegante e focada no progresso",
                  "Estratégia orientada ao resultado sem complicação",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <ShieldCheck className="mt-0.5 shrink-0 text-cyan-200" size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-24 pb-8">
          <Card className="border border-slate-200 bg-white/80 p-8 text-center shadow-[0_20px_36px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] text-white shadow-[0_18px_32px_rgba(13,99,104,0.18)]">
              <Sparkles size={18} />
            </div>
            <h2 className="mt-5 font-display text-4xl text-slate-950">Comece a evoluir com Nina Coach.</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
              Uma rotina mais inteligente para você treinar melhor, com foco e consistência.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/login">
                <Button className="rounded-xl bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] px-5 py-3 text-sm text-white shadow-[0_18px_32px_rgba(13,99,104,0.22)]">
                  Começar agora
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="rounded-xl border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm">
                  Entrar na plataforma
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        <footer className="mt-10 border-t border-slate-200/80 pt-6 pb-2 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[linear-gradient(135deg,#061C2B_0%,#1DB7B8_100%)] text-[10px] font-bold text-white">NC</span>
            <span>Nina Coach</span>
          </div>
          <p className="mt-3">Seu treino guiado por inteligência.</p>
        </footer>
      </main>
    </div>
  );
}
