"use client";

import * as React from "react";
import { RotateCcw, Calendar, Clock, AlertTriangle, FileText } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { Commitment } from "@/lib/types";
import { formatDateTime } from "@/lib/date-utils";

export interface RenegotiateModalProps {
  commitment: Commitment | null;
  isOpen: boolean;
  onClose: () => void;
  onRenegotiated?: () => void;
}

function toLocalDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function RenegotiateModal({
  commitment,
  isOpen,
  onClose,
  onRenegotiated,
}: RenegotiateModalProps) {
  const [revisedDate, setRevisedDate] = React.useState("");
  const [revisedTime, setRevisedTime] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const renegotiate = useCommitmentStore((state) => state.renegotiate);

  // Initialize date/time when commitment opens
  React.useEffect(() => {
    if (commitment && isOpen) {
      // Suggest tomorrow or current due + 1 day
      const baseTimestamp = Math.max(commitment.currentDueTimestamp, Date.now());
      const suggestedTimestamp = baseTimestamp + 24 * 60 * 60 * 1000;
      setRevisedDate(toLocalDate(suggestedTimestamp));
      setRevisedTime(toLocalTime(suggestedTimestamp));
      setReason("");
      setError(null);
    }
  }, [commitment, isOpen]);

  if (!commitment) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!revisedDate || !revisedTime) {
      setError("Please select both a revised date and time.");
      return;
    }

    const [year, month, day] = revisedDate.split("-").map(Number);
    const [hours, minutes] = revisedTime.split(":").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      setError("Invalid date or time format.");
      return;
    }

    const revisedDueTimestamp = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
    const now = Date.now();

    // Strictly enforce future deadline
    if (revisedDueTimestamp <= now) {
      setError("Revised deadline must be in the future.");
      return;
    }

    try {
      renegotiate(commitment.id, revisedDueTimestamp, reason.trim() || undefined);
      onRenegotiated?.();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to renegotiate commitment";
      setError(message);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="sm:max-w-md">
      <DialogCloseButton onClose={handleClose} />
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-amber-600" />
          Renegotiate Commitment
        </DialogTitle>
        <DialogDescription>
          When circumstances change, renegotiate directly rather than silently missing deadlines.
        </DialogDescription>
      </DialogHeader>

      {/* Commitment Summary Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-sm my-2 space-y-1">
        <div className="font-semibold text-slate-900">{commitment.title}</div>
        <div className="text-xs text-slate-600 flex items-center justify-between">
          <span>To: <strong className="text-slate-800">{commitment.recipientName}</strong></span>
          <span className="text-slate-500">{`Current: ${formatDateTime(commitment.currentDueTimestamp)}`}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div
            role="alert"
            className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Revised Due Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reneg-due-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Revised Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="reneg-due-date"
                type="date"
                value={revisedDate}
                onChange={(e) => setRevisedDate(e.target.value)}
                className="w-full pl-9 pr-2 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="reneg-due-time" className="block text-xs font-semibold text-slate-700 mb-1">
              Revised Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="reneg-due-time"
                type="time"
                value={revisedTime}
                onChange={(e) => setRevisedTime(e.target.value)}
                className="w-full pl-9 pr-2 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Reason / Context */}
        <div>
          <label htmlFor="reneg-reason" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Reason for Revision <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="reneg-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scope expanded, dependency delayed, mutually agreed extension..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400 transition resize-none"
          />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="warning" className="bg-amber-600 hover:bg-amber-700 text-white">
            Confirm Extension
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
