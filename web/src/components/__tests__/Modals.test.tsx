import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { QuickCaptureModal } from "@/components/ledger/QuickCaptureModal";
import { RenegotiateModal } from "@/components/ledger/RenegotiateModal";
import { useCommitmentStore } from "@/lib/store/commitment-store";
import { Commitment } from "@/lib/types";

describe("QuickCaptureModal component", () => {
  beforeEach(() => {
    useCommitmentStore.getState().resetStore();
  });

  it("renders when isOpen is true", () => {
    const html = renderToString(
      <QuickCaptureModal isOpen={true} onClose={() => {}} />
    );

    expect(html).toContain("New Commitment");
    expect(html).toContain("Recipient");
    expect(html).toContain("What did you promise?");
    expect(html).toContain("Due Date");
    expect(html).toContain("Due Time");
    expect(html).toContain("Reminder Notice");
    expect(html).toContain("Save Commitment");
  });

  it("does not render when isOpen is false", () => {
    const html = renderToString(
      <QuickCaptureModal isOpen={false} onClose={() => {}} />
    );

    expect(html).toBe("");
  });

  it("integrates with commitment store addCommitment action", () => {
    const store = useCommitmentStore.getState();
    const countBefore = store.commitments.length;

    const created = store.addCommitment({
      recipientName: "Test Recipient",
      title: "Test Commitment Action",
      notes: "Some notes",
      dueTimestamp: Date.now() + 3600 * 1000,
      reminderOffsetMinutes: 15,
    });

    expect(created.id).toBeDefined();
    expect(created.recipientName).toBe("Test Recipient");
    expect(created.title).toBe("Test Commitment Action");
    expect(useCommitmentStore.getState().commitments.length).toBe(countBefore + 1);
  });
});

describe("RenegotiateModal component", () => {
  const sampleCommitment: Commitment = {
    id: "reneg-test-1",
    userId: "u-1",
    recipientName: "Sarah Connor",
    title: "Complete audit review",
    originalDueTimestamp: Date.now() + 10000,
    currentDueTimestamp: Date.now() + 10000,
    status: "PENDING",
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
    closedAt: null,
    isArchived: false,
    isDeleted: false,
  };

  beforeEach(() => {
    useCommitmentStore.getState().resetStore([sampleCommitment], []);
  });

  it("renders when isOpen is true with commitment details", () => {
    const html = renderToString(
      <RenegotiateModal
        commitment={sampleCommitment}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(html).toContain("Renegotiate Commitment");
    expect(html).toContain("Complete audit review");
    expect(html).toContain("Sarah Connor");
    expect(html).toContain("Revised Date");
    expect(html).toContain("Revised Time");
    expect(html).toContain("Reason for Revision");
    expect(html).toContain("Confirm Extension");
  });

  it("does not render when commitment is null", () => {
    const html = renderToString(
      <RenegotiateModal
        commitment={null}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(html).toBe("");
  });

  it("strictly enforces future deadline when renegotiating via store", () => {
    const store = useCommitmentStore.getState();
    const pastTimestamp = Date.now() - 10000;

    expect(() => {
      store.renegotiate(sampleCommitment.id, pastTimestamp, "Past extension");
    }).toThrow("Revised due date must be in the future");
  });

  it("successfully records renegotiation audit trail when given future deadline", () => {
    const store = useCommitmentStore.getState();
    const futureTimestamp = Date.now() + 48 * 60 * 60 * 1000;

    store.renegotiate(sampleCommitment.id, futureTimestamp, "Scope expansion approved");

    const updated = useCommitmentStore.getState().commitments.find((c) => c.id === sampleCommitment.id);
    expect(updated?.status).toBe("RENEGOTIATED");
    expect(updated?.currentDueTimestamp).toBe(futureTimestamp);

    const records = useCommitmentStore.getState().renegotiations;
    expect(records.length).toBe(1);
    expect(records[0].commitmentId).toBe(sampleCommitment.id);
    expect(records[0].reason).toBe("Scope expansion approved");
  });
});
