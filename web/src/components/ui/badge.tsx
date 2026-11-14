import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800",
        secondary: "bg-slate-100 text-slate-800 border border-slate-200",
        destructive: "bg-rose-500 text-white",
        outline: "border border-slate-300 text-slate-700",
        overdue: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
        kept: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
        renegotiated: "bg-amber-50 text-amber-700 border border-amber-200 font-semibold",
        released: "bg-slate-100 text-slate-600 border border-slate-200 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
