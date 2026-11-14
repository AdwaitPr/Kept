import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Kept — Interpersonal Commitment Ledger",
  description: "A calm, reliable ledger for promises made to other people",
  keywords: [
    "commitments",
    "promises",
    "accountability",
    "interpersonal",
    "offline-first",
    "ledger",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-slate-200">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Kept</span>
              <span className="text-slate-300">•</span>
              <span>A calm, reliable ledger for promises made to other people.</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                Private & Local-First
              </span>
              <span className="text-slate-300">•</span>
              <span>Keep your word. Rest easy.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
