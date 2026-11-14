"use client";

import * as React from "react";
import { User, Calendar, Clock, Bell, Plus, Check } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { Commitment, REMINDER_OFFSET_OPTIONS, ReminderOffset } from "@/lib/types";

export interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (commitment: Commitment) => void;
}

function getInitialDueDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialDueTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0); // 2 hours from now rounded
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function QuickCaptureModal({ isOpen, onClose, onCreated }: QuickCaptureModalProps) {
  const [recipientName, setRecipientName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [dueDate, setDueDate] = React.useState(getInitialDueDate);
  const [dueTime, setDueTime] = React.useState(getInitialDueTime);
  const [reminderOffset, setReminderOffset] = React.useState<ReminderOffset>(15);

  const [showRecipientSuggestions, setShowRecipientSuggestions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addCommitment = useCommitmentStore((state) => state.addCommitment);
  const getRecentRecipients = useCommitmentStore((state) => state.getRecentRecipients);

  const recipientSuggestions = React.useMemo(() => {
    if (!isOpen) return [];
    return getRecentRecipients(recipientName, 5);
  }, [isOpen, recipientName, getRecentRecipients]);

  const resetForm = React.useCallback(() => {
    setRecipientName("");
    setTitle("");
    setNotes("");
    setDueDate(getInitialDueDate());
    setDueTime(getInitialDueTime());
    setReminderOffset(15);
    setError(null);
    setShowRecipientSuggestions(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanRecipient = recipientName.trim();
    if (!cleanRecipient) {
      setError("Please specify who this commitment is for.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Commitment title cannot be empty.");
      return;
    }

    if (!dueDate || !dueTime) {
      setError("Please set a valid due date and time.");
      return;
    }

    const [year, month, day] = dueDate.split("-").map(Number);
    const [hours, minutes] = dueTime.split(":").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      setError("Invalid date or time format.");
      return;
    }

    const dueTimestamp = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();

    try {
      const created = addCommitment({
        recipientName: cleanRecipient,
        title: cleanTitle,
        notes: notes.trim() || undefined,
        dueTimestamp,
        reminderOffsetMinutes: reminderOffset,
      });

      onCreated?.(created);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record commitment";
      setError(message);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="sm:max-w-md">
      <DialogCloseButton onClose={handleClose} />
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-slate-700" />
          New Commitment
        </DialogTitle>
        <DialogDescription>
          Record a clear promise to someone. Kept holds you accountable until it's honored, renegotiated, or released.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div
            role="alert"
            className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium"
          >
            {error}
          </div>
        )}

        {/* Recipient Input with Autocomplete */}
        <div className="relative">
          <label htmlFor="quick-recipient" className="block text-xs font-semibold text-slate-700 mb-1">
            Recipient <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="quick-recipient"
              type="text"
              autoComplete="off"
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                setShowRecipientSuggestions(true);
              }}
              onFocus={() => setShowRecipientSuggestions(true)}
              placeholder="e.g. Sarah Connor, Dr. Evans, Marcus"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition"
              required
            />
          </div>

          {/* Recipient Suggestions Dropdown */}
          {showRecipientSuggestions && recipientSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recent Recipients
              </div>
              {recipientSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setRecipientName(name);
                    setShowRecipientSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between text-slate-800 transition"
                >
                  <span>{name}</span>
                  {recipientName.trim().toLowerCase() === name.toLowerCase() && (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Commitment Title */}
        <div>
          <label htmlFor="quick-title" className="block text-xs font-semibold text-slate-700 mb-1">
            What did you promise? <span className="text-rose-500">*</span>
          </label>
          <input
            id="quick-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Send updated budget spreadsheet, Review draft PR"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition"
            required
          />
        </div>

        {/* Notes (Optional) */}
        <div>
          <label htmlFor="quick-notes" className="block text-xs font-semibold text-slate-700 mb-1">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="quick-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key deliverables, context, or links..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition resize-none"
          />
        </div>

        {/* Due Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quick-due-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="quick-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-2 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="quick-due-time" className="block text-xs font-semibold text-slate-700 mb-1">
              Due Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="quick-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full pl-9 pr-2 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Reminder Offset Selector */}
        <div>
          <label htmlFor="quick-reminder-offset" className="block text-xs font-semibold text-slate-700 mb-1">
            Reminder Notice
          </label>
          <div className="relative">
            <Bell className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              id="quick-reminder-offset"
              value={reminderOffset === null ? "null" : String(reminderOffset)}
              onChange={(e) => {
                const val = e.target.value;
                setReminderOffset(val === "null" ? null : (Number(val) as ReminderOffset));
              }}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition appearance-none cursor-pointer"
            >
              {REMINDER_OFFSET_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={opt.value === null ? "null" : String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" className="shadow-sm">
            Save Commitment
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
