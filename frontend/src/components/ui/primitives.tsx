import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[linear-gradient(135deg,#0b1d24_0%,#123f4e_35%,#19a4a5_100%)] text-[#f8fbfb] shadow-[0_20px_40px_rgba(15,35,42,0.22)] hover:-translate-y-0.5 hover:shadow-[0_28px_50px_rgba(15,35,42,0.28)] active:translate-y-0",
        secondary: "border border-[#d9d2ca] bg-white/80 text-[#1a2a2a] backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_24px_rgba(9,26,31,0.08)]",
        ghost: "text-[#1b2a2a] hover:bg-slate-100/80",
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
  return <div className={cn("luxury-card rounded-[1.6rem] border border-[#e9e1db] bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,242,237,0.96)_100%)] text-[#1a2220] shadow-[0_28px_60px_rgba(16,26,27,0.08)] backdrop-blur-sm", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "live";
  className?: string;
}) {
  const map = {
    neutral: "bg-[#f0eee9] text-[#403d39]",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    live: "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-sm",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.12em] uppercase", map[tone], className)}>{children}</span>;
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
