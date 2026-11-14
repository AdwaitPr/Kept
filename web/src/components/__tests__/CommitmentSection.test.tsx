import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { CommitmentSection } from "@/components/ledger/CommitmentSection";
import { Commitment } from "@/lib/types";
import { AlertCircle, Calendar } from "lucide-react";

describe("CommitmentSection component", () => {
  const sampleCommitments: Commitment[] = [
    {
      id: "section-c-1",
      userId: "u-1",
      recipientName: "Alice",
      title: "Deliver Q3 report",
      notes: "Financial tables included",
      originalDueTimestamp: Date.now() + 100000,
      currentDueTimestamp: Date.now() + 100000,
      status: "PENDING",
      createdAt: Date.now() - 50000,
      updatedAt: Date.now() - 50000,
      closedAt: null,
      isArchived: false,
      isDeleted: false,
    },
    {
      id: "section-c-2",
      userId: "u-1",
      recipientName: "Bob",
      title: "Review design mocks",
      originalDueTimestamp: Date.now() + 200000,
      currentDueTimestamp: Date.now() + 200000,
      status: "PENDING",
      createdAt: Date.now() - 50000,
      updatedAt: Date.now() - 50000,
      closedAt: null,
      isArchived: false,
      isDeleted: false,
    },
  ];

  it("renders section title, icon, and commitment count badge", () => {
    const html = renderToString(
      <CommitmentSection
        title="Upcoming"
        icon={<Calendar className="h-4 w-4" />}
        commitments={sampleCommitments}
      />
    );

    expect(html).toContain("Upcoming");
    expect(html).toContain(">2<");
    expect(html).toContain("Deliver Q3 report");
    expect(html).toContain("Review design mocks");
  });

  it("renders calm reassuring empty state when commitments count is 0", () => {
    const overdueHtml = renderToString(
      <CommitmentSection
        title="Overdue"
        icon={<AlertCircle className="h-4 w-4" />}
        commitments={[]}
      />
    );

    expect(htmlOverdue(overdueHtml)).toContain("Nothing overdue");
    expect(overdueHtml).toContain(">0<");

    const todayHtml = renderToString(
      <CommitmentSection
        title="Today"
        commitments={[]}
      />
    );
    expect(todayHtml).toContain("No commitments due today");
  });

  it("supports custom empty message", () => {
    const html = renderToString(
      <CommitmentSection
        title="Custom Section"
        commitments={[]}
        emptyMessage="All promises fulfilled for this category."
      />
    );

    expect(html).toContain("All promises fulfilled for this category.");
  });
});

function htmlOverdue(html: string) {
  return html;
}
