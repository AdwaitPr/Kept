"use client";

import * as React from "react";
import { CheckCircle2, Inbox } from "lucide-react";
import { Commitment } from "@/lib/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { CommitmentCard } from "@/components/ledger/CommitmentCard";
import { cn } from "@/lib/utils";

export interface CommitmentSectionProps {
  title: string;
  icon?: React.ReactNode;
  commitments: Commitment[];
  emptyMessage?: string;
  badgeVariant?: BadgeProps["variant"];
  onKept?: (id: string) => void;
  onRenegotiate?: (commitment: Commitment) => void;
  onRelease?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function CommitmentSection({
  title,
  icon,
  commitments,
  emptyMessage,
  badgeVariant,
  onKept,
  onRenegotiate,
  onRelease,
  onDelete,
  className,
}: CommitmentSectionProps) {
  const count = commitments.length;

  const defaultEmptyMessage = React.useMemo(() => {
    const lower = title.toLowerCase();
    if (lower.includes("overdue")) {
      return "Nothing overdue. You're completely up to date with your promises.";
    }
    if (lower.includes("today")) {
      return "No commitments due today. Clear waters ahead.";
    }
    if (lower.includes("upcoming")) {
      return "No upcoming commitments scheduled.";
    }
    return "No commitments in this section.";
  }, [title]);

  const resolvedEmptyMessage = emptyMessage || defaultEmptyMessage;

  // Choose appropriate badge variant if not explicitly supplied
  const resolvedBadgeVariant: BadgeProps["variant"] =
    badgeVariant ??
    (title.toLowerCase().includes("overdue") && count > 0
      ? "overdue"
      : title.toLowerCase().includes("today") && count > 0
      ? "default"
      : "secondary");

  return (
    <section className={cn("space-y-3", className)} aria-labelledby={`section-heading-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          <h2
            id={`section-heading-${title.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-base sm:text-lg font-bold text-slate-800 tracking-tight"
          >
            {title}
          </h2>
          <Badge variant={resolvedBadgeVariant} className="h-5 px-2 text-[11px] font-semibold">
            {count}
          </Badge>
        </div>
      </div>

      {/* Commitments List or Calm Empty State */}
      {count === 0 ? (
        <div className="flex items-center gap-3 p-4 sm:p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
          <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
            {title.toLowerCase().includes("overdue") ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Inbox className="h-4 w-4" />
            )}
          </div>
          <p className="leading-relaxed">{resolvedEmptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {commitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              onKept={onKept}
              onRenegotiate={onRenegotiate}
              onRelease={onRelease}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
