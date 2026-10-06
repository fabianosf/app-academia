import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-coral text-white hover:bg-coral-deep disabled:opacity-50",
    secondary: "bg-white text-stone-800 border border-stone-200 hover:bg-stone-50",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100",
    danger: "bg-rose-100 text-rose-800 hover:bg-rose-200",
  };
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45d32] disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "live" }) {
  const map = {
    neutral: "bg-stone-100 text-stone-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    live: "bg-rose-600 text-white",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", map[tone])}>{children}</span>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-[#e07a4a]", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-[#e07a4a]", props.className)} />;
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[#e07a4a]" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
