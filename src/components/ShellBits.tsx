import { Bell, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { notifications, user } from "@/data/mock";
import { useApp } from "@/hooks/AppContext";

export function AppHeader() {
  const { brand } = useApp();
  const [open, setOpen] = useState(false);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-stone-200/80 bg-[#f7f4ef]/90 px-4 py-3 backdrop-blur md:px-8">
      <div>
        <p className="text-xs text-stone-500 md:hidden">{brand}</p>
        <p className="font-display text-base font-semibold md:text-lg">{hello}, {user.name}</p>
        <p className="text-xs text-stone-500">{user.streakDays} dias em movimento</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/nina" className="hidden items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-[#c45d32] sm:inline-flex" aria-label="Atalho para a Nina">
          <Sparkles size={16} /> Nina
        </Link>
        <button className="relative rounded-full border border-stone-200 bg-white p-2" aria-label="Notificações" onClick={() => setOpen((v) => !v)}>
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#e07a4a]" />
        </button>
        <Link to="/perfil" className="grid h-10 w-10 place-items-center rounded-full bg-stone-900 text-sm font-semibold text-white" aria-label="Perfil">{user.avatarInitials}</Link>
      </div>
      {open && (
        <div className="absolute right-4 top-16 w-80 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold">Notificações</p>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="rounded-xl bg-stone-50 p-3 text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-stone-600">{n.body}</p>
                <p className="mt-1 text-xs text-stone-400">{n.time}{n.read ? "" : " · nova"}</p>
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
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-stone-600">{subtitle}</p>}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function SafetyNotice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">{children}</p>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{text}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return <div className="h-28 animate-pulse rounded-2xl bg-stone-200/70" aria-hidden />;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
