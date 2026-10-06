import { Bell, MoonStar, Sparkles, SunMedium } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "@/hooks/AppContext";

export function AppHeader() {
  const { brand, theme, setTheme, user, notifications } = useApp();
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <header className={isDark ? "sticky top-0 z-30 border-b border-[#2d312f] bg-[rgba(18,20,19,0.76)] px-4 py-3 backdrop-blur-xl md:px-8" : "sticky top-0 z-30 border-b border-[#eae0d9] bg-[rgba(245,240,234,0.78)] px-4 py-3 backdrop-blur-xl md:px-8"}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div>
          <p className={isDark ? "text-[10px] uppercase tracking-[0.22em] text-[#b9b0a6] md:hidden" : "text-[10px] uppercase tracking-[0.22em] text-[#7b857d] md:hidden"}>{brand}</p>
          <p className={isDark ? "font-display text-base font-semibold text-[#f5efe8] md:text-xl" : "font-display text-base font-semibold text-[#1f2c27] md:text-xl"}>{hello}, {user.name}</p>
          <p className={isDark ? "text-xs text-[#c1b9b1]" : "text-xs text-[#66706a]"}>{user.streakDays} dias em movimento</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/nina" className={isDark ? "hidden items-center gap-2 rounded-xl border border-[#a86645]/40 bg-[linear-gradient(135deg,#f8eae1_0%,#f1d6c4_100%)] px-3 py-2 text-sm font-semibold text-[#8b4838] shadow-[0_12px_24px_rgba(168,102,69,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_24px_rgba(168,102,69,0.24)] sm:inline-flex" : "hidden items-center gap-2 rounded-xl border border-[#f0d8cb] bg-[#fff5f1] px-3 py-2 text-sm font-semibold text-[#b1603d] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#fce9e0] sm:inline-flex"} aria-label="Atalho para a Nina">
            <Sparkles size={16} /> Nina
          </Link>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={isDark ? "rounded-xl border border-[#2d312f] bg-[#1a211f] p-2.5 text-[#f4efe9] shadow-[0_12px_20px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[#1f2926]" : "rounded-xl border border-[#eadfdb] bg-white/80 p-2.5 text-[#2d3b36] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"}
            aria-label="Alternar tema"
            title="Alternar tema"
          >
            {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
          <button className={isDark ? "relative rounded-xl border border-[#2d312f] bg-[#1a211f] p-2.5 shadow-[0_12px_20px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[#1f2926]" : "relative rounded-xl border border-[#eadfdb] bg-white/80 p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"} aria-label="Notificações" onClick={() => setOpen((v) => !v)}>
            <Bell size={18} className={isDark ? "text-[#f4efe9]" : "text-[#2d3b36]"} />
            <span className={isDark ? "absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#d96f4f] ring-2 ring-[#1a211f]" : "absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#d96f4f] ring-2 ring-[#f7f1ed]"} />
          </button>
          <Link to="/perfil" className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#1d2a26_0%,#32463d_100%)] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(29,42,38,0.24)] transition-transform hover:-translate-y-0.5" aria-label="Perfil">{user.avatarInitials}</Link>
        </div>
      </div>
      {open && (
        <div className={isDark ? "absolute right-4 top-16 w-80 max-w-[calc(100vw-2rem)] rounded-[1.25rem] border border-[#2d312f] bg-[rgba(22,26,24,0.96)] p-3 shadow-[0_22px_40px_rgba(12,14,13,0.28)] backdrop-blur-xl" : "absolute right-4 top-16 w-80 max-w-[calc(100vw-2rem)] rounded-[1.25rem] border border-[#eadfdb] bg-white/90 p-3 shadow-[0_18px_38px_rgba(22,24,22,0.12)] backdrop-blur-xl"}>
          <p className={isDark ? "mb-2 text-sm font-semibold text-[#f4efe9]" : "mb-2 text-sm font-semibold text-[#1f2c27]"}>Notificações</p>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={isDark ? "rounded-2xl border border-[#2d312f] bg-[#1b211e] p-3 text-sm" : "rounded-2xl bg-[#f8f5f2] p-3 text-sm"}>
                <p className={isDark ? "font-medium text-[#f2e8e1]" : "font-medium text-[#23332d]"}>{n.title}</p>
                <p className={isDark ? "mt-1 text-[#c7beb5]" : "mt-1 text-[#4c564f]"}>{n.body}</p>
                <p className={isDark ? "mt-2 text-[11px] uppercase tracking-[0.12em] text-[#b5aea6]" : "mt-2 text-[11px] uppercase tracking-[0.12em] text-[#7c817b]"}>{n.time}{n.read ? "" : " · nova"}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1d2a26] md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#5e655f]">{subtitle}</p>}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-xl font-semibold text-[#1d2a26]">{title}</h2>
      {action}
    </div>
  );
}

export function SafetyNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-[#f0d89e] bg-[#fff9ef] px-3 py-2 text-xs leading-relaxed text-[#7a5c2a]">{children}</p>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#d8d0ca] bg-white/70 px-6 py-10 text-center">
      <p className="font-display text-xl font-semibold text-[#1d2a26]">{title}</p>
      <p className="mt-1 text-sm text-[#58625c]">{text}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return <div className="h-28 animate-pulse rounded-[1.25rem] bg-[#eae1d8]" aria-hidden />;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[#ece1d8] bg-white/80 p-4 shadow-[0_12px_24px_rgba(27,31,29,0.04)]">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#787f7a]">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-[#1d2a26]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#5e655f]">{hint}</p>}
    </div>
  );
}
