import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { CommitmentCard } from "@/components/ledger/CommitmentCard";
import { Commitment } from "@/lib/types";

describe("CommitmentCard component", () => {
  const baseCommitment: Commitment = {
    id: "test-commitment-1",
    userId: "test-user-1",
    recipientName: "Marcus Vance",
    title: "Send updated contract draft",
    notes: "Review clause 3 and 7 before sending.",
    originalDueTimestamp: Date.now() + 2 * 60 * 60 * 1000,
    currentDueTimestamp: Date.now() + 2 * 60 * 60 * 1000,
    status: "PENDING",
    createdAt: Date.now() - 3600 * 1000,
    updatedAt: Date.now() - 3600 * 1000,
    closedAt: null,
    isArchived: false,
    isDeleted: false,
  };

  it("renders recipient pill and title", () => {
    const html = renderToString(<CommitmentCard commitment={baseCommitment} />);
    expect(html).toContain("To: Marcus Vance");
    expect(html).toContain("Send updated contract draft");
  });

  it("renders overdue badge when dueTimestamp is in the past", () => {
    const overdueCommitment: Commitment = {
      ...baseCommitment,
      currentDueTimestamp: Date.now() - 24 * 60 * 60 * 1000,
    };
    const html = renderToString(<CommitmentCard commitment={overdueCommitment} />);
    expect(html).toContain("Overdue");
  });

  it("renders renegotiated badge when status is RENEGOTIATED", () => {
    const renegCommitment: Commitment = {
      ...baseCommitment,
      status: "RENEGOTIATED",
    };
    const html = renderToString(<CommitmentCard commitment={renegCommitment} />);
    expect(html).toContain("Renegotiated");
  });

  it("renders closed status badge when status is KEPT or RELEASED", () => {
    const keptCommitment: Commitment = {
      ...baseCommitment,
      status: "KEPT",
      closedAt: Date.now(),
    };
    const htmlKept = renderToString(<CommitmentCard commitment={keptCommitment} />);
    expect(htmlKept).toContain("Kept");
    expect(htmlKept).toContain("Closed commitment");

    const releasedCommitment: Commitment = {
      ...baseCommitment,
      status: "RELEASED",
      closedAt: Date.now(),
    };
    const htmlReleased = renderToString(<CommitmentCard commitment={releasedCommitment} />);
    expect(htmlReleased).toContain("Released");
  });

  it("renders notes toggle button when notes are present", () => {
    const html = renderToString(<CommitmentCard commitment={baseCommitment} />);
    expect(html).toContain("View notes");
  });

  it("renders Kept, Renegotiate, and Release action buttons for active commitments", () => {
    const html = renderToString(<CommitmentCard commitment={baseCommitment} />);
    expect(html).toContain("Kept");
    expect(html).toContain("Renegotiate");
    expect(html).toContain("Release");
    expect(html).toContain("aria-label=\"Delete commitment\"");
  });
});
