"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  RotateCcw,
  Handshake,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sparkles,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { Commitment, isActiveStatus } from "@/lib/types";
import { getEndOfDayMillis, formatDueDate, isOverdue } from "@/lib/date-utils";
import { RenegotiateModal } from "@/components/ledger/RenegotiateModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReviewPage() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [sessionKeptCount, setSessionKeptCount] = React.useState(0);
  const [sessionRenegotiatedCount, setSessionRenegotiatedCount] = React.useState(0);
  const [sessionReleasedCount, setSessionReleasedCount] = React.useState(0);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    type: "kept" | "renegotiated" | "released";
    text: string;
  } | null>(null);

  const [renegotiatingCommitment, setRenegotiatingCommitment] = React.useState<Commitment | null>(null);

  const commitments = useCommitmentStore((state) => state.commitments);
  const getReviewQueue = useCommitmentStore((state) => state.getReviewQueue);
  const markKept = useCommitmentStore((state) => state.markKept);
  const markReleased = useCommitmentStore((state) => state.markReleased);

  // Filter unclosed commitments due today or earlier
  const reviewQueue = React.useMemo(() => getReviewQueue(), [commitments, getReviewQueue]);

  // Adjust index if queue shrinks
  React.useEffect(() => {
    if (currentIndex >= reviewQueue.length && reviewQueue.length > 0) {
      setCurrentIndex(Math.max(0, reviewQueue.length - 1));
    }
  }, [reviewQueue.length, currentIndex]);

  const currentCommitment: Commitment | undefined = reviewQueue[currentIndex];
  const totalReviewedInSession = sessionKeptCount + sessionRenegotiatedCount + sessionReleasedCount;
  const initialTotal = totalReviewedInSession + reviewQueue.length;
  const progressPercent = initialTotal > 0 ? Math.round((totalReviewedInSession / initialTotal) * 100) : 100;

  const showFeedback = (type: "kept" | "renegotiated" | "released", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  const handleKept = (commitment: Commitment) => {
    markKept(commitment.id);
    setSessionKeptCount((prev) => prev + 1);
    showFeedback("kept", `Honored promise to ${commitment.recipientName}`);
  };

  const handleRelease = (commitment: Commitment) => {
    markReleased(commitment.id);
    setSessionReleasedCount((prev) => prev + 1);
    showFeedback("released", `Released promise to ${commitment.recipientName}`);
  };

  const handleRenegotiateSuccess = () => {
    if (renegotiatingCommitment) {
      setSessionRenegotiatedCount((prev) => prev + 1);
      showFeedback("renegotiated", `Renegotiated new date with ${renegotiatingCommitment.recipientName}`);
    }
    setRenegotiatingCommitment(null);
  };

  const handleNext = () => {
    if (reviewQueue.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % reviewQueue.length);
    }
  };

  const handlePrev = () => {
    if (reviewQueue.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + reviewQueue.length) % reviewQueue.length);
    }
  };



  // Clear / Finished State
  if (reviewQueue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 text-center">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
          <Moon className="h-10 w-10 text-amber-300" />
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-emerald-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Your ledger is clear for tonight. Sleep peacefully.
        </h1>

        <p className="mt-3 text-base text-slate-600 max-w-md mx-auto leading-relaxed">
          Every promise due today has been honored, renegotiated, or released. You have closed the loop.
        </p>

        {totalReviewedInSession > 0 && (
          <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white max-w-sm mx-auto shadow-xs text-xs text-slate-700 space-y-1.5">
            <div className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
              Tonight's Review Summary
            </div>
            <div className="flex justify-between">
              <span>Promises Kept:</span>
              <strong className="text-emerald-700 font-semibold">{sessionKeptCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Promises Renegotiated:</span>
              <strong className="text-amber-700 font-semibold">{sessionRenegotiatedCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Promises Released:</span>
              <strong className="text-slate-700 font-semibold">{sessionReleasedCount}</strong>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button size="lg" className="gap-2 font-medium shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Ledger</span>
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" size="lg" className="font-medium">
              <span>View History</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Active Review Triage State
  const overdue = currentCommitment ? isOverdue(currentCommitment.currentDueTimestamp) : false;

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Header & Philosophy */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ledger</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800">End-of-Day Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Close the Loop
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Decide the fate of every promise due today. No commitment is left in limbo.
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1 font-semibold text-xs border-slate-300 text-slate-700">
          {currentIndex + 1} of {reviewQueue.length} remaining
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-slate-900 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Ephemeral Feedback Toast */}
      {feedbackMessage && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm ${
            feedbackMessage.type === "kept"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : feedbackMessage.type === "renegotiated"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-slate-100 border-slate-200 text-slate-800"
          }`}
        >
          {feedbackMessage.type === "kept" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
          {feedbackMessage.type === "renegotiated" && <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" />}
          {feedbackMessage.type === "released" && <Handshake className="h-4 w-4 text-slate-600 shrink-0" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Focused Interactive Triage Card */}
      {currentCommitment && (
        <article
          className={`rounded-2xl border bg-white p-6 sm:p-8 shadow-md transition-all ${
            overdue
              ? "border-rose-200 ring-1 ring-rose-200"
              : "border-slate-200"
          }`}
        >
          {/* Card Top Pill & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>To: {currentCommitment.recipientName}</span>
            </div>

            <div className="flex items-center gap-2">
              {overdue ? (
                <Badge variant="overdue" className="gap-1 px-2.5 py-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{formatDueDate(currentCommitment.currentDueTimestamp)}</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDueDate(currentCommitment.currentDueTimestamp)}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {currentCommitment.title}
          </h2>

          {/* Notes if present */}
          {currentCommitment.notes && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                <FileText className="h-3 w-3" />
                <span>Notes</span>
              </div>
              {currentCommitment.notes}
            </div>
          )}

          {/* Decision Question */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
              What is the status of this commitment?
            </div>

            {/* 3 Explicit Triage Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Kept */}
              <button
                type="button"
                onClick={() => handleKept(currentCommitment)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300 transition active:scale-[0.98] shadow-xs group"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm">Kept</span>
                <span className="text-[11px] text-emerald-700 mt-0.5 text-center">
                  I honored this promise
                </span>
              </button>

              {/* Option 2: Renegotiate */}
              <button
                type="button"
                onClick={() => setRenegotiatingCommitment(currentCommitment)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-300 transition active:scale-[0.98] shadow-xs group"
              >
                <div className="h-10 w-10 rounded-full bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm">Renegotiate</span>
                <span className="text-[11px] text-amber-700 mt-0.5 text-center">
                  Set new agreed date
                </span>
              </button>

              {/* Option 3: Release */}
              <button
                type="button"
                onClick={() => handleRelease(currentCommitment)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition active:scale-[0.98] shadow-xs group"
              >
                <div className="h-10 w-10 rounded-full bg-slate-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <Handshake className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm">Release</span>
                <span className="text-[11px] text-slate-600 mt-0.5 text-center">
                  Excused by recipient
                </span>
              </button>
            </div>
          </div>
        </article>
      )}

      {/* Pagination / Skip Navigation */}
      {reviewQueue.length > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1 hover:text-slate-900 transition px-2 py-1 rounded"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-slate-400">
            {currentIndex + 1} of {reviewQueue.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 hover:text-slate-900 transition px-2 py-1 rounded"
          >
            <span>Skip for now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Renegotiate Modal for active commitment */}
      <RenegotiateModal
        commitment={renegotiatingCommitment}
        isOpen={Boolean(renegotiatingCommitment)}
        onClose={() => setRenegotiatingCommitment(null)}
        onRenegotiated={handleRenegotiateSuccess}
      />
    </div>
  );
}
