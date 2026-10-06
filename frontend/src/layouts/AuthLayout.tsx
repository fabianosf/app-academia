import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthLayout({
  children,
  eyebrow = "Forma com Fabiano",
  title,
  subtitle,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden text-[#1d2a26]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(212,141,103,0.34),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(142,126,103,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(197,161,118,0.16),transparent_30%),linear-gradient(180deg,#f7f2ed_0%,#efe7e0_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#e2b18f]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[#c9d5c4]/35 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-8 md:px-10 md:py-12">
          <Link to="/login" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#1d2a26_0%,#32463d_100%)] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(29,42,38,0.28)]">
              FF
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7c665d]">
                {eyebrow}
              </p>
              <p className="font-display text-lg font-semibold text-[#1d2a26]">Forma com Fabiano</p>
            </div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-xl py-10 lg:py-0"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6d5d]">
              Treino com presença
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#1d2a26] md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#526653] md:text-lg">
              {subtitle}
            </p>
            <div className="mt-8 hidden h-44 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#f4e4d6_0%,#e8d2c0_40%,#d7e0d4_100%)] shadow-[0_28px_60px_rgba(32,30,28,0.1)] lg:block">
              <div className="flex h-full flex-col justify-end bg-[linear-gradient(180deg,transparent_20%,rgba(29,42,38,0.55)_100%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f6efe8]/80">
                  Casa · Academia · Consistência
                </p>
                <p className="mt-2 font-display text-2xl text-white">
                  Seu ritmo, com técnica e cuidado.
                </p>
              </div>
            </div>
          </motion.div>

          <p className="hidden text-xs text-[#7a847c] lg:block">
            Conteúdo educativo. Não substitui avaliação profissional.
          </p>
        </section>

        <section className="flex items-center px-4 pb-10 md:px-8 lg:pr-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            className="w-full rounded-[1.75rem] border border-[#eae0d9] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(247,242,236,0.94)_100%)] p-6 shadow-[0_28px_64px_rgba(32,30,28,0.1)] backdrop-blur-sm md:p-8"
          >
            {children}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
