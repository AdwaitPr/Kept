"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Search,
  X,
  CheckCircle2,
  ListTodo,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { Commitment } from "@/lib/types";
import { CommitmentSection } from "@/components/ledger/CommitmentSection";
import { QuickCaptureModal } from "@/components/ledger/QuickCaptureModal";
import { RenegotiateModal } from "@/components/ledger/RenegotiateModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LedgerPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRecipient, setSelectedRecipient] = React.useState<string | null>(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = React.useState(false);
  const [renegotiatingCommitment, setRenegotiatingCommitment] = React.useState<Commitment | null>(null);

  const commitments = useCommitmentStore((state) => state.commitments);
  const getOverdue = useCommitmentStore((state) => state.getOverdue);
  const getToday = useCommitmentStore((state) => state.getToday);
  const getUpcoming = useCommitmentStore((state) => state.getUpcoming);
  const subscribeToRealtime = useCommitmentStore((state) => state.subscribeToRealtime);

  // Subscribe to realtime database updates on mount
  React.useEffect(() => {
    const unsubscribe = subscribeToRealtime();
    return () => {
      unsubscribe();
    };
  }, [subscribeToRealtime]);

  // Compute lists
  const overdueList = React.useMemo(() => getOverdue(), [commitments, getOverdue]);
  const todayList = React.useMemo(() => getToday(), [commitments, getToday]);
  const upcomingList = React.useMemo(() => getUpcoming(), [commitments, getUpcoming]);

  const totalActiveCount = overdueList.length + todayList.length + upcomingList.length;

  // Compute unique active recipients with their counts
  const activeRecipientsWithCount = React.useMemo(() => {
    const counts = new Map<string, number>();
    const allActive = [...overdueList, ...todayList, ...upcomingList];
    for (const c of allActive) {
      counts.set(c.recipientName, (counts.get(c.recipientName) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [overdueList, todayList, upcomingList]);

  // Filter helper
  const filterCommitments = React.useCallback(
    (list: Commitment[]) => {
      let filtered = list;

      if (selectedRecipient) {
        filtered = filtered.filter(
          (c) => c.recipientName.toLowerCase() === selectedRecipient.toLowerCase()
        );
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.recipientName.toLowerCase().includes(query) ||
            (c.notes && c.notes.toLowerCase().includes(query))
        );
      }

      return filtered;
    },
    [selectedRecipient, searchQuery]
  );

  const filteredOverdue = React.useMemo(() => filterCommitments(overdueList), [filterCommitments, overdueList]);
  const filteredToday = React.useMemo(() => filterCommitments(todayList), [filterCommitments, todayList]);
  const filteredUpcoming = React.useMemo(() => filterCommitments(upcomingList), [filterCommitments, upcomingList]);

  const hasFilter = Boolean(searchQuery.trim() || selectedRecipient);
  const isAllClear = overdueList.length === 0 && todayList.length === 0;



  return (
    <div className="space-y-6">
      {/* Top Header & Summary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Commitment Ledger
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track promises made to others with unambiguous closure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/review">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-medium border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ListTodo className="h-4 w-4 text-slate-600" />
              <span>EOD Review</span>
              {todayList.length + overdueList.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                  {todayList.length + overdueList.length}
                </span>
              )}
            </Button>
          </Link>

          <Button
            onClick={() => setIsQuickCaptureOpen(true)}
            size="sm"
            className="gap-1.5 font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Commitment</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Metric 1: Active Commitments */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Commitments
            </span>
            <span className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalActiveCount}</span>
            <span className="text-xs text-slate-500">
              {todayList.length} due today
            </span>
          </div>
        </div>

        {/* Metric 2: Overdue Commitments */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            overdueList.length > 0
              ? "border-rose-200 bg-rose-50/40"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                overdueList.length > 0 ? "text-rose-700" : "text-slate-500"
              }`}
            >
              Overdue
            </span>
            <span
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                overdueList.length > 0
                  ? "bg-rose-100 text-rose-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                overdueList.length > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {overdueList.length}
            </span>
            <span
              className={`text-xs ${
                overdueList.length > 0 ? "text-rose-600 font-medium" : "text-slate-500"
              }`}
            >
              {overdueList.length > 0 ? "Needs attention" : "All on schedule"}
            </span>
          </div>
        </div>

        {/* Metric 3: Review Status */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Review Status
            </span>
            <span
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isAllClear
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isAllClear ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-sm font-semibold text-slate-900">
              {isAllClear ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  Clear for tonight
                </span>
              ) : (
                <span className="text-amber-800 font-bold">
                  {overdueList.length + todayList.length} pending close
                </span>
              )}
            </div>
            {!isAllClear && (
              <Link
                href="/review"
                className="text-xs font-medium text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 hover:underline"
              >
                <span>Review</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert Banner if count > 0 */}
      {overdueList.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 shadow-xs"
        >
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-rose-900">
              {overdueList.length === 1
                ? "You have 1 overdue commitment."
                : `You have ${overdueList.length} overdue commitments.`}
            </p>
            <p className="text-rose-700 mt-0.5 leading-relaxed text-xs sm:text-sm">
              Keep your word by renegotiating an agreed-upon extension with the recipient or marking it kept if already completed.
            </p>
          </div>
          <Link href="/review">
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0 text-xs shadow-xs"
            >
              Triage Now
            </Button>
          </Link>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commitments by title, recipient, or notes..."
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Recipient Tag Pills */}
        {activeRecipientsWithCount.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              Filter by person:
            </span>
            <button
              type="button"
              onClick={() => setSelectedRecipient(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                selectedRecipient === null
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({totalActiveCount})
            </button>

            {activeRecipientsWithCount.map(([name, count]) => {
              const isSelected = selectedRecipient?.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setSelectedRecipient(isSelected ? null : name)
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-slate-700 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRecipient(null);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Sections: Overdue, Today, Upcoming */}
      <div className="space-y-8">
        {/* Overdue Section */}
        {(filteredOverdue.length > 0 || (!hasFilter && overdueList.length > 0)) && (
          <CommitmentSection
            title="Overdue"
            icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
            commitments={filteredOverdue}
            badgeVariant="overdue"
            emptyMessage="No overdue commitments matching your filter."
            onRenegotiate={(c) => setRenegotiatingCommitment(c)}
          />
        )}

        {/* Due Today Section */}
        <CommitmentSection
          title="Due Today"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          commitments={filteredToday}
          badgeVariant="default"
          emptyMessage={
            hasFilter
              ? "No commitments due today match your filter."
              : "No commitments due today. Clear waters ahead."
          }
          onRenegotiate={(c) => setRenegotiatingCommitment(c)}
        />

        {/* Upcoming Section */}
        <CommitmentSection
          title="Upcoming"
          icon={<Calendar className="h-5 w-5 text-slate-500" />}
          commitments={filteredUpcoming}
          badgeVariant="secondary"
          emptyMessage={
            hasFilter
              ? "No upcoming commitments match your filter."
              : "No upcoming commitments scheduled."
          }
          onRenegotiate={(c) => setRenegotiatingCommitment(c)}
        />
      </div>

      {/* Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      <RenegotiateModal
        commitment={renegotiatingCommitment}
        isOpen={Boolean(renegotiatingCommitment)}
        onClose={() => setRenegotiatingCommitment(null)}
      />
    </div>
  );
}
