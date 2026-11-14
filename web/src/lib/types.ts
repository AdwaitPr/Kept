/**
 * Core domain status enum matching Kept Android CommitmentStatus.
 *
 * Distinct from generic task manager states (e.g. todo/done):
 * - PENDING: Initial active state where commitment has not yet reached deadline.
 * - RENEGOTIATED: Active state indicating deadline was revised by mutual agreement.
 * - KEPT: Terminal positive state indicating promise was honored and closed.
 * - RELEASED: Terminal neutral state indicating recipient excused the promise.
 */
export type CommitmentStatus = 'PENDING' | 'RENEGOTIATED' | 'KEPT' | 'RELEASED';

/**
 * Standard reminder offset in minutes matching Android Kept options.
 * 0: At time of event
 * 15: 15 minutes before
 * 60: 1 hour before
 * 1440: 1 day before
 * null: No reminder
 */
export type ReminderOffset = 0 | 15 | 60 | 1440 | null;

export const REMINDER_OFFSET_OPTIONS: { label: string; value: ReminderOffset }[] = [
  { label: 'At time of event', value: 0 },
  { label: '15 minutes before', value: 15 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
  { label: 'No reminder', value: null },
];

/**
 * Primary domain model representing an interpersonal commitment.
 * All timestamps are recorded in UTC epoch milliseconds.
 */
export interface Commitment {
  id: string;
  userId: string;
  recipientName: string;
  title: string;
  notes?: string | null;
  originalDueTimestamp: number;
  currentDueTimestamp: number;
  status: CommitmentStatus;
  createdAt: number;
  updatedAt: number;
  closedAt?: number | null;
  reminderOffsetMinutes?: number | null;
  reminderScheduledAt?: number | null;
  isArchived: boolean;
  isDeleted?: boolean;
}

/**
 * Immutable audit trail entity when a commitment is renegotiated.
 */
export interface RenegotiationRecord {
  id: string;
  commitmentId: string;
  userId: string;
  previousDueTimestamp: number;
  revisedDueTimestamp: number;
  reason?: string | null;
  createdAt: number;
}

/**
 * DTO for creating a new commitment.
 */
export interface CreateCommitmentInput {
  recipientName: string;
  title: string;
  dueTimestamp: number;
  notes?: string;
  reminderOffsetMinutes?: ReminderOffset;
}

/**
 * DTO for renegotiating an active commitment.
 */
export interface RenegotiateInput {
  commitmentId: string;
  revisedDueTimestamp: number;
  reason?: string;
}

/**
 * Lifecycle helper functions mirroring Android CommitmentStatus
 */
export function isActiveStatus(status: CommitmentStatus): boolean {
  return status === 'PENDING' || status === 'RENEGOTIATED';
}

export function isClosedStatus(status: CommitmentStatus): boolean {
  return status === 'KEPT' || status === 'RELEASED';
}
