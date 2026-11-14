import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import LedgerPage from "@/app/page";
import ReviewPage from "@/app/review/page";
import HistoryPage from "@/app/history/page";
import { metadata } from "@/app/layout";
import { useCommitmentStore } from "@/lib/store/commitment-store";

describe("Application Pages & Routing", () => {
  beforeEach(() => {
    useCommitmentStore.getState().resetStore();
  });

  describe("Root Layout Metadata", () => {
    it("exports correct title and description", () => {
      expect(metadata.title).toBe("Kept — Interpersonal Commitment Ledger");
      expect(metadata.description).toBe("A calm, reliable ledger for promises made to other people");
    });
  });

  describe("Main Ledger Page (app/page.tsx)", () => {
    it("renders page title and summary metrics", () => {
      const html = renderToString(<LedgerPage />);
      expect(html).toContain("Commitment Ledger");
      expect(html).toContain("Active Commitments");
      expect(html).toContain("Overdue");
      expect(html).toContain("Review Status");
    });

    it("renders sections for categorized commitments", () => {
      const html = renderToString(<LedgerPage />);
      expect(html).toContain("Overdue");
      expect(html).toContain("Due Today");
      expect(html).toContain("Upcoming");
    });

    it("renders search and filter bar elements", () => {
      const html = renderToString(<LedgerPage />);
      expect(html).toContain("Search commitments by title, recipient, or notes...");
      expect(html).toContain("Filter by person:");
      expect(html).toContain("All");
    });
  });

  describe("End-of-Day Review Page (app/review/page.tsx)", () => {
    it("renders triage review interface or calm clear state", () => {
      const html = renderToString(<ReviewPage />);
      // Depending on seed state, should either have review header or calm clear state
      const hasReviewDeck = html.includes("Close the Loop") || html.includes("End-of-Day Review");
      const hasCalmCompletion = html.includes("Your ledger is clear for tonight. Sleep peacefully.");
      expect(hasReviewDeck || hasCalmCompletion).toBe(true);
    });

    it("displays explicit triage choices (Kept, Renegotiate, Release) when items are due", () => {
      const html = renderToString(<ReviewPage />);
      if (html.includes("Close the Loop")) {
        expect(html).toContain("Kept");
        expect(html).toContain("Renegotiate");
        expect(html).toContain("Release");
      }
    });

    it("renders peaceful completion state when queue is empty", () => {
      // Empty the active queue by resetting with only closed commitments
      useCommitmentStore.getState().resetStore([], []);
      const html = renderToString(<ReviewPage />);
      expect(html).toContain("Your ledger is clear for tonight. Sleep peacefully.");
      expect(html).toContain("Back to Ledger");
    });
  });

  describe("Commitment History Page (app/history/page.tsx)", () => {
    it("renders history header and metrics", () => {
      const html = renderToString(<HistoryPage />);
      expect(html).toContain("Commitment History");
      expect(html).toContain("Total Closed");
      expect(html).toContain("Promises Kept");
      expect(html).toContain("Released Promises");
    });

    it("renders status filter pills", () => {
      const html = renderToString(<HistoryPage />);
      expect(html).toContain("Status:");
      expect(html).toContain("All");
      expect(html).toContain("Kept");
      expect(html).toContain("Released");
    });

    it("displays closed seed commitments and renegotiation badges", () => {
      const html = renderToString(<HistoryPage />);
      expect(html).toContain("Deploy v1.2 beta release candidate");
      expect(html).toContain("Amara Patel");
      expect(html).toContain("Renegotiated once");
    });

    it("renders calm empty state when no closed commitments exist", () => {
      useCommitmentStore.getState().resetStore([], []);
      const html = renderToString(<HistoryPage />);
      expect(html).toContain("No closed commitments yet");
    });
  });
});
