import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthLayout({
  children,
  eyebrow = "Aster Coach",
  title,
  subtitle,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden text-[#132021]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(19,156,167,0.20),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(191,155,110,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(12,62,70,0.12),transparent_32%),linear-gradient(180deg,#f7f4f0_0%,#f1eae2_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#9dc9c2]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[#d9b998]/25 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-8 md:px-10 md:py-12">
          <Link to="/login" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#184a5d_40%,#24a4a6_100%)] text-sm font-semibold text-white shadow-[0_16px_30px_rgba(19,43,49,0.2)]">
              AC
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b7d7a]">
                {eyebrow}
              </p>
              <p className="font-display text-lg font-semibold text-[#132021]">Aster Coach</p>
            </div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-xl py-10 lg:py-0"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5d7671]">
              Treino com presença
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#132021] md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#4e5f5b] md:text-lg">
              {subtitle}
            </p>
            <div className="mt-8 hidden h-44 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#edf4f0_0%,#d9ece8_35%,#d9d4c8_100%)] shadow-[0_28px_60px_rgba(32,30,28,0.1)] lg:block">
              <div className="flex h-full flex-col justify-end bg-[linear-gradient(180deg,transparent_20%,rgba(11,26,29,0.62)_100%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#edf4f0]/80">
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
            className="w-full rounded-[1.9rem] border border-[#e8dfd8] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(247,243,239,0.96)_100%)] p-6 shadow-[0_30px_68px_rgba(17,27,30,0.12)] backdrop-blur-sm md:p-8"
          >
            {children}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
