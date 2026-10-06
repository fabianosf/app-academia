import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[linear-gradient(135deg,#e2a17f_0%,#cd7755_42%,#aa5338_100%)] text-[#fffaf7] shadow-[0_18px_32px_rgba(200,108,74,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(200,108,74,0.38)] active:translate-y-0",
        secondary: "border border-[#2f3634] bg-[#181d1b] text-[#f3ece7] backdrop-blur-sm hover:-translate-y-0.5 hover:bg-[#1e2624] hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)]",
        ghost: "text-[#f2eae4] hover:bg-white/6",
        danger: "bg-rose-100 text-rose-800 hover:bg-rose-200",
      },
      size: {
        default: "min-h-10 px-4 py-2.5",
        sm: "min-h-8 px-3 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("luxury-card rounded-[1.5rem] border border-[#eae0d9] bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(243,237,233,0.9)_100%)] text-[#1a2220] shadow-[0_24px_52px_rgba(32,30,28,0.06)] backdrop-blur-sm", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "live" }) {
  const map = {
    neutral: "bg-[#f0eee9] text-[#403d39]",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    live: "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-sm",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.12em] uppercase", map[tone])}>{children}</span>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-xl border border-border bg-white/80 px-3 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/70 focus:ring-2 focus:ring-primary/10", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full rounded-xl border border-border bg-white/80 px-3 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/70 focus:ring-2 focus:ring-primary/10", props.className)} />;
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e9e4de]" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[linear-gradient(90deg,#c98d68_0%,#b65c3b_100%)]" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
