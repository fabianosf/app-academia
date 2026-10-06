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
  const { brand, theme } = useApp();
  const isDark = theme === "dark";

  return (
    <aside className={cn(
      "hidden w-72 shrink-0 border-r shadow-[18px_0_46px_rgba(17,18,16,0.18)] backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen md:flex-col",
      isDark
        ? "border-[#2d302d] bg-[linear-gradient(180deg,#1b201d_0%,#171b18_100%)]"
        : "border-[#e7dfd7] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(244,238,232,0.95)_100%)]",
    )}>
      <div className={cn("border-b px-5 py-6", isDark ? "border-[#2d312f]" : "border-[#efe2d8]")}>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#dba07e_0%,#be6b4c_52%,#8d4938_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(191,105,73,0.35)]">F</div>
          <div>
            <p className={cn("font-display text-xl font-semibold tracking-tight", isDark ? "text-[#f5efe8]" : "text-[#1f2c27]")}>{brand}</p>
            <p className={cn("mt-0.5 text-[11px] uppercase tracking-[0.2em]", isDark ? "text-[#b8b0a6]" : "text-[#7b806e]")}>Wellness studio</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 px-3 py-5" aria-label="Principal">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
              isActive
                ? isDark
                  ? "bg-[linear-gradient(135deg,#f4e7df_0%,#ebd4c1_100%)] text-[#ae5d3f] shadow-[inset_0_0_0_1px_rgba(164,90,61,0.14),0_12px_24px_rgba(18,18,16,0.18)]"
                  : "bg-[linear-gradient(135deg,#f7ece5_0%,#f0d5c2_100%)] text-[#a85f40] shadow-[inset_0_0_0_1px_rgba(164,90,61,0.14),0_14px_24px_rgba(94,82,77,0.06)]"
                : isDark
                  ? "text-[#d5d0ca] hover:bg-white/5 hover:text-[#f6f0eb]"
                  : "text-[#5d655f] hover:bg-white/80 hover:text-[#1f2c27]",
            )}
          >
            {({ isActive }) => (
              <>
                <span className={cn("grid h-8 w-8 place-items-center rounded-xl transition-all", isActive ? (isDark ? "bg-white text-[#ad5d3d] shadow-[0_10px_18px_rgba(197,130,93,0.18)]" : "bg-white text-[#a75d3d] shadow-[0_10px_18px_rgba(170,94,61,0.1)]") : (isDark ? "bg-[#2a302d] text-[#e7ded7]" : "bg-[#f3eee9] text-[#5e615d]"))}>
                  <item.icon size={16} aria-hidden />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={cn("border-t p-4 text-[11px] leading-relaxed tracking-[0.08em] uppercase", isDark ? "border-[#2d312f] text-[#b9b0a6]" : "border-[#efe2d8] text-[#7a7f79]")}>Conteúdo educativo. Não substitui avaliação profissional.</div>
    </aside>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[#ece3dd] bg-[rgba(255,255,255,0.88)] px-1 pt-1 shadow-[0_-12px_24px_rgba(27,31,29,0.08)] backdrop-blur-xl md:hidden" aria-label="Navegação móvel">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => cn(
            "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-all",
            isActive ? "text-[#b75b3c]" : "text-[#5d655f] hover:text-[#1f2c27]",
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon size={18} aria-hidden className={cn(isActive ? "text-[#b75b3c]" : "text-[#5d655f]")} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
