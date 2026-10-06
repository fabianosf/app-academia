import { NavLink } from "react-router-dom";
import { Activity, CalendarDays, House, Sparkles, TrendingUp, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/hooks/AppContext";

const items = [
  { to: "/", label: "Início", icon: House, end: true },
  { to: "/treinos", label: "Treinos", icon: Activity },
  { to: "/ao-vivo", label: "Ao vivo", icon: CalendarDays },
  { to: "/progresso", label: "Progresso", icon: TrendingUp },
  { to: "/nina", label: "Nina IA", icon: Sparkles },
  { to: "/perfil", label: "Perfil", icon: UserRound },
];

export function AppSidebar() {
  const { brand } = useApp();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-stone-200/80 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col">
      <div className="border-b border-stone-100 px-5 py-6">
        <p className="font-display text-lg font-semibold tracking-tight text-stone-900">{brand}</p>
        <p className="mt-0.5 text-xs text-stone-500">Treino com calma e consistência</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Principal">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", isActive ? "bg-orange-50 text-[#b8542c]" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900")}>
            <item.icon size={18} aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-stone-100 p-4 text-xs leading-relaxed text-stone-400">Conteúdo educativo. Não substitui avaliação profissional.</div>
    </aside>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-stone-200/80 bg-white/95 px-1 pt-1 shadow-[0_-4px_20px_rgba(28,25,23,0.04)] backdrop-blur md:hidden" aria-label="Navegação móvel">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-colors", isActive ? "text-[#b8542c]" : "text-stone-500 hover:text-stone-800")}>
          <item.icon size={18} aria-hidden />
          <span className="max-w-full truncate px-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
