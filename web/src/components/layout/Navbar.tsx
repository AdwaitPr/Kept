"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Plus, Sparkles, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCaptureModal } from "@/components/ledger/QuickCaptureModal";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  currentPath?: string;
  onNewCommitment?: () => void;
  className?: string;
}

export function Navbar({ currentPath, onNewCommitment, className }: NavbarProps) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = React.useState(false);
  const isSyncing = useCommitmentStore((state) => state.isSyncing);

  // Determine active route
  let activePath = currentPath;
  try {
    const routerPath = usePathname();
    if (!activePath && routerPath) {
      activePath = routerPath;
    }
  } catch {
    // Rendered outside Next router context (e.g. testing)
  }
  activePath = activePath || "/";

  const isRealtimeConfigured = isSupabaseConfigured();

  const handleOpenCapture = () => {
    if (onNewCommitment) {
      onNewCommitment();
    } else {
      setIsQuickCaptureOpen(true);
    }
  };

  const navLinks = [
    { label: "Ledger", href: "/" },
    { label: "Daily Review", href: "/review" },
    { label: "History", href: "/history" },
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-colors",
          className
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 group select-none hover:opacity-90 transition"
            >
              <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                  Kept
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 leading-none">
                  Commitment Ledger
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = activePath === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Sync Pill & Action Button */}
          <div className="flex items-center gap-3">
            {/* Sync Status Pill */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200/80 text-slate-600"
              title={
                isRealtimeConfigured
                  ? "Connected to cloud database with real-time replication"
                  : "Running locally with offline persistence"
              }
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : isRealtimeConfigured ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Local-First</span>
                </>
              )}
            </div>

            {/* "+ New Commitment" Button */}
            <Button
              onClick={handleOpenCapture}
              variant="default"
              size="sm"
              className="font-medium shadow-sm gap-1.5 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>New Commitment</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-4 py-2 bg-slate-50/50">
          {navLinks.map((link) => {
            const isActive = activePath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-white text-slate-900 font-semibold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Embedded QuickCaptureModal if not externally controlled */}
      {!onNewCommitment && (
        <QuickCaptureModal
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
        />
      )}
    </>
  );
}
