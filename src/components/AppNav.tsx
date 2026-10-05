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
    <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white md:flex md:flex-col">
      <div className="px-5 py-6">
        <p className="font-display text-lg font-semibold tracking-tight text-stone-900">{brand}</p>
        <p className="text-xs text-stone-500">Treino com calma e consistência</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", isActive ? "bg-orange-50 text-[#c45d32]" : "text-stone-600 hover:bg-stone-50")}>
            <item.icon size={18} aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-stone-400">Conteúdo educativo. Não substitui avaliação profissional.</div>
    </aside>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-stone-200 bg-white/95 px-1 py-1 backdrop-blur md:hidden" aria-label="Navegação móvel">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium", isActive ? "text-[#c45d32]" : "text-stone-500")}>
          <item.icon size={18} aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
