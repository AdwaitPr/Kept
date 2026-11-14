"use client";

import * as React from "react";
import {
  User,
  Clock,
  Calendar,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
} from "lucide-react";
import { Commitment, isActiveStatus } from "@/lib/types";
import { formatDueDate, isOverdue, isDueToday } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RenegotiateModal } from "@/components/ledger/RenegotiateModal";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { cn } from "@/lib/utils";

export interface CommitmentCardProps {
  commitment: Commitment;
  onKept?: (id: string) => void;
  onRenegotiate?: (commitment: Commitment) => void;
  onRelease?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function CommitmentCard({
  commitment,
  onKept,
  onRenegotiate,
  onRelease,
  onDelete,
  className,
}: CommitmentCardProps) {
  const [isNotesExpanded, setIsNotesExpanded] = React.useState(false);
  const [isRenegotiateModalOpen, setIsRenegotiateModalOpen] = React.useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  const markKept = useCommitmentStore((state) => state.markKept);
  const markReleased = useCommitmentStore((state) => state.markReleased);
  const deleteCommitment = useCommitmentStore((state) => state.deleteCommitment);

  const active = isActiveStatus(commitment.status);
  const overdue = active && isOverdue(commitment.currentDueTimestamp);
  const dueToday = active && !overdue && isDueToday(commitment.currentDueTimestamp);

  const handleKept = () => {
    if (onKept) {
      onKept(commitment.id);
    } else {
      markKept(commitment.id);
    }
  };

  const handleRenegotiateClick = () => {
    if (onRenegotiate) {
      onRenegotiate(commitment);
    } else {
      setIsRenegotiateModalOpen(true);
    }
  };

  const handleRelease = () => {
    if (onRelease) {
      onRelease(commitment.id);
    } else {
      markReleased(commitment.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(commitment.id);
    } else {
      deleteCommitment(commitment.id);
    }
    setIsConfirmingDelete(false);
  };

  return (
    <>
      <article
        className={cn(
          "group relative rounded-xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md",
          overdue
            ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
            : "border-slate-200 hover:border-slate-300",
          className
        )}
      >
        {/* Top Row: Recipient Pill & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          {/* Recipient Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
            <User className="h-3 w-3 text-slate-500" />
            <span>{`To: ${commitment.recipientName}`}</span>
          </div>

          {/* Badges: Due Date / Overdue / Renegotiated */}
          <div className="flex flex-wrap items-center gap-1.5">
            {commitment.status === "RENEGOTIATED" && (
              <Badge variant="renegotiated" className="gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>Renegotiated</span>
              </Badge>
            )}

            {commitment.status === "KEPT" && (
              <Badge variant="kept" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Kept</span>
              </Badge>
            )}

            {commitment.status === "RELEASED" && (
              <Badge variant="released">
                <span>Released</span>
              </Badge>
            )}

            {active && overdue && (
              <Badge variant="overdue" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{formatDueDate(commitment.currentDueTimestamp)}</span>
              </Badge>
            )}

            {active && dueToday && (
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-50 text-blue-700 border-blue-200 font-semibold"
              >
                <Clock className="h-3 w-3" />
                <span>{formatDueDate(commitment.currentDueTimestamp)}</span>
              </Badge>
            )}

            {active && !overdue && !dueToday && (
              <Badge variant="outline" className="gap-1 text-slate-600 font-normal">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{formatDueDate(commitment.currentDueTimestamp)}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Commitment Title */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-snug">
          {commitment.title}
        </h3>

        {/* Optional Collapsible Notes */}
        {commitment.notes && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsNotesExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span>{isNotesExpanded ? "Hide notes" : "View notes"}</span>
              {isNotesExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {isNotesExpanded && (
              <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-150">
                {commitment.notes}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Action Buttons for Active Commitments */}
          {active ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={handleKept}
                className="gap-1.5 font-medium shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Kept</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRenegotiateClick}
                className="gap-1.5 font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                <span>Renegotiate</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRelease}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Release
              </Button>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Closed commitment • Archived in ledger
            </div>
          )}

          {/* Delete Action (with inline two-step confirmation) */}
          <div className="flex items-center gap-1.5 ml-auto">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-rose-600 font-medium">Delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-700 transition"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                aria-label="Delete commitment"
                title="Delete commitment"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Embedded RenegotiateModal if not externally handled */}
      {!onRenegotiate && (
        <RenegotiateModal
          commitment={commitment}
          isOpen={isRenegotiateModalOpen}
          onClose={() => setIsRenegotiateModalOpen(false)}
        />
      )}
    </>
  );
}
