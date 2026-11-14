"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Handshake,
  RotateCcw,
  Search,
  X,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
  ArrowLeft,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { Commitment, CommitmentStatus, RenegotiationRecord } from "@/lib/types";
import { formatDateTime, formatDateOnly } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "KEPT" | "RELEASED">("ALL");
  const [expandedCommitmentIds, setExpandedCommitmentIds] = React.useState<Set<string>>(new Set());

  const getHistory = useCommitmentStore((state) => state.getHistory);
  const commitments = useCommitmentStore((state) => state.commitments);
  const renegotiations = useCommitmentStore((state) => state.renegotiations);



  const historyList = React.useMemo(() => getHistory(), [commitments, getHistory]);

  // Summary Metrics
  const totalClosed = historyList.length;
  const keptCount = historyList.filter((c) => c.status === "KEPT").length;
  const releasedCount = historyList.filter((c) => c.status === "RELEASED").length;
  const keptRate = totalClosed > 0 ? Math.round((keptCount / totalClosed) * 100) : 0;

  // Filtered List
  const filteredHistory = React.useMemo(() => {
    return historyList.filter((c) => {
      // Status filter
      if (statusFilter !== "ALL" && c.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesRecipient = c.recipientName.toLowerCase().includes(query);
        const matchesNotes = Boolean(c.notes && c.notes.toLowerCase().includes(query));
        return matchesTitle || matchesRecipient || matchesNotes;
      }

      return true;
    });
  }, [historyList, statusFilter, searchQuery]);

  // Toggle audit trail expansion
  const toggleExpanded = (id: string) => {
    setExpandedCommitmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };



  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ledger</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800">History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Commitment History
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Your permanent integrity record of closed promises and renegotiation audit trails.
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="font-medium">
            Active Ledger
          </Button>
        </Link>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Metric 1: Total Closed */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Closed
            </span>
            <span className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <History className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalClosed}</span>
            <span className="text-xs text-slate-500">commitments resolved</span>
          </div>
        </div>

        {/* Metric 2: Kept Rate */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Promises Kept
            </span>
            <span className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-800">{keptCount}</span>
            <span className="text-xs text-emerald-700 font-semibold">
              {totalClosed > 0 ? `${keptRate}% completion rate` : "No history yet"}
            </span>
          </div>
        </div>

        {/* Metric 3: Released */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Released Promises
            </span>
            <span className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Handshake className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{releasedCount}</span>
            <span className="text-xs text-slate-500">mutually excused</span>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by title, recipient, or notes..."
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

        {/* Filter Pills: All, Kept, Released */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
          {(["ALL", "KEPT", "RELEASED"] as const).map((status) => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status === "ALL" && `All (${totalClosed})`}
                {status === "KEPT" && `Kept (${keptCount})`}
                {status === "RELEASED" && `Released (${releasedCount})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
          <History className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">
            {totalClosed === 0
              ? "No closed commitments yet"
              : "No records match your filters"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {totalClosed === 0
              ? "As you mark promises Kept or Released in your ledger, they will be preserved here as your integrity log."
              : "Try adjusting your search terms or clearing status filters."}
          </p>
          {totalClosed > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="mt-4"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((commitment) => {
            const isKept = commitment.status === "KEPT";
            const auditRecords = renegotiations
              .filter((r) => r.commitmentId === commitment.id)
              .sort((a, b) => b.createdAt - a.createdAt);
            const isExpanded = expandedCommitmentIds.has(commitment.id);

            return (
              <article
                key={commitment.id}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Header Row: Recipient Pill & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    <User className="h-3 w-3 text-slate-500" />
                    <span>To: {commitment.recipientName}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {isKept ? (
                      <Badge variant="kept" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Kept</span>
                      </Badge>
                    ) : (
                      <Badge variant="released" className="gap-1">
                        <Handshake className="h-3 w-3" />
                        <span>Released</span>
                      </Badge>
                    )}

                    {/* Renegotiation Count Badge */}
                    {auditRecords.length > 0 && (
                      <Badge variant="renegotiated" className="gap-1">
                        <RotateCcw className="h-3 w-3" />
                        <span>
                          {auditRecords.length === 1
                            ? "Renegotiated once"
                            : `Renegotiated ${auditRecords.length}x`}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Commitment Title */}
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-snug">
                  {commitment.title}
                </h3>

                {/* Optional Notes */}
                {commitment.notes && (
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {commitment.notes}
                  </p>
                )}

                {/* Date & Audit Info Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    {commitment.closedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Closed: {formatDateTime(commitment.closedAt)}</span>
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Original Due: {formatDateOnly(commitment.originalDueTimestamp)}</span>
                    </span>
                  </div>

                  {/* Toggle Audit Trail button if renegotiations exist */}
                  {auditRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(commitment.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors py-0.5 px-2 rounded hover:bg-amber-50"
                    >
                      <span>
                        {isExpanded ? "Hide audit trail" : "View renegotiation log"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expandable Renegotiation Audit Trail */}
                {isExpanded && auditRecords.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-100/80 bg-amber-50/40 rounded-lg p-3 space-y-2 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                      <span>Renegotiation Audit Trail</span>
                    </div>

                    <div className="space-y-2">
                      {auditRecords.map((record, index) => (
                        <div
                          key={record.id}
                          className="bg-white border border-amber-200/80 rounded-md p-2.5 text-xs space-y-1 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-semibold text-slate-700">
                              Revision #{auditRecords.length - index}
                            </span>
                            <span>{formatDateTime(record.createdAt)}</span>
                          </div>

                          <div className="text-slate-700">
                            <span className="text-slate-400 line-through mr-1.5">
                              {formatDateTime(record.previousDueTimestamp)}
                            </span>
                            <span className="font-semibold text-emerald-700">
                              → {formatDateTime(record.revisedDueTimestamp)}
                            </span>
                          </div>

                          {record.reason && (
                            <div className="text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                              "{record.reason}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
