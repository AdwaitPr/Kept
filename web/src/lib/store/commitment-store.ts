import { create } from 'zustand';
import {
  Commitment,
  CommitmentStatus,
  CreateCommitmentInput,
  RenegotiationRecord,
  isActiveStatus,
  isClosedStatus,
} from '../types';
import {
  isOverdue,
  isDueToday,
  isUpcoming,
  computeReminderTriggerTime,
  getEndOfDayMillis,
} from '../date-utils';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

export const DEMO_USER_ID = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates deterministic or relative default seed data for local development and demos.
 */
export function createDefaultSeedData(now: number = Date.now()): {
  commitments: Commitment[];
  renegotiations: RenegotiationRecord[];
} {
  const endOfDay = getEndOfDayMillis(now);

  // 1. Overdue (Due yesterday)
  const overdueDue = now - 24 * 60 * 60 * 1000;

  // 2. Today #1 & #2 (Ensure they fall within today and are >= now)
  let today1Due = now + 2 * 60 * 60 * 1000;
  let today2Due = now + 5 * 60 * 60 * 1000;
  if (today1Due >= endOfDay) {
    today1Due = Math.max(now + 1000, endOfDay - 60 * 1000);
  }
  if (today2Due >= endOfDay) {
    today2Due = Math.max(today1Due + 1000, endOfDay - 1000);
  }

  // 3. Upcoming (Due in 3 days)
  const upcomingDue = now + 3 * 24 * 60 * 60 * 1000;

  // 4. History (KEPT with audit trail)
  const keptOrigDue = now - 5 * 24 * 60 * 60 * 1000;
  const keptCurrDue = now - 2 * 24 * 60 * 60 * 1000;
  const keptClosed = now - 24 * 60 * 60 * 1000;

  const keptCommitmentId = '55555555-5555-4555-8555-555555555555';

  const commitments: Commitment[] = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      userId: DEMO_USER_ID,
      recipientName: 'Sarah Chen',
      title: 'Send finalized Q4 budget review',
      notes: 'Include updated runway estimates and engineering headcount breakdown.',
      originalDueTimestamp: overdueDue,
      currentDueTimestamp: overdueDue,
      status: 'PENDING',
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      closedAt: null,
      reminderOffsetMinutes: 15,
      reminderScheduledAt: overdueDue - 15 * 60 * 1000,
      isArchived: false,
      isDeleted: false,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      userId: DEMO_USER_ID,
      recipientName: 'Marcus Vance',
      title: 'Review Kept Android PR #42',
      notes: 'Check offline Room migration and WorkManager scheduling logic.',
      originalDueTimestamp: today1Due,
      currentDueTimestamp: today1Due,
      status: 'PENDING',
      createdAt: now - 24 * 60 * 60 * 1000,
      updatedAt: now - 24 * 60 * 60 * 1000,
      closedAt: null,
      reminderOffsetMinutes: 30,
      reminderScheduledAt: today1Due - 30 * 60 * 1000,
      isArchived: false,
      isDeleted: false,
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      userId: DEMO_USER_ID,
      recipientName: 'Elena Rostova',
      title: 'Sign partnership agreement draft',
      notes: 'Review clauses 4.1 and 7.3 regarding intellectual property.',
      originalDueTimestamp: today2Due,
      currentDueTimestamp: today2Due,
      status: 'PENDING',
      createdAt: now - 2 * 60 * 60 * 1000,
      updatedAt: now - 2 * 60 * 60 * 1000,
      closedAt: null,
      reminderOffsetMinutes: 0,
      reminderScheduledAt: today2Due,
      isArchived: false,
      isDeleted: false,
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      userId: DEMO_USER_ID,
      recipientName: 'David K.',
      title: 'Deliver keynote slide deck for Tech Summit',
      notes: 'Include customer case studies and benchmark graphs.',
      originalDueTimestamp: upcomingDue,
      currentDueTimestamp: upcomingDue,
      status: 'PENDING',
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      closedAt: null,
      reminderOffsetMinutes: 60,
      reminderScheduledAt: upcomingDue - 60 * 60 * 1000,
      isArchived: false,
      isDeleted: false,
    },
    {
      id: keptCommitmentId,
      userId: DEMO_USER_ID,
      recipientName: 'Amara Patel',
      title: 'Deploy v1.2 beta release candidate',
      notes: 'Pushed to internal dogfood channel after resolving proguard issue.',
      originalDueTimestamp: keptOrigDue,
      currentDueTimestamp: keptCurrDue,
      status: 'KEPT',
      createdAt: now - 6 * 24 * 60 * 60 * 1000,
      updatedAt: keptClosed,
      closedAt: keptClosed,
      reminderOffsetMinutes: 15,
      reminderScheduledAt: null,
      isArchived: false,
      isDeleted: false,
    },
  ];

  const renegotiations: RenegotiationRecord[] = [
    {
      id: '66666666-6666-4666-8666-666666666666',
      commitmentId: keptCommitmentId,
      userId: DEMO_USER_ID,
      previousDueTimestamp: keptOrigDue,
      revisedDueTimestamp: keptCurrDue,
      reason: 'Needed extra time to resolve Android ProGuard build minimization issue with Room entities.',
      createdAt: now - 4 * 24 * 60 * 60 * 1000,
    },
  ];

  return { commitments, renegotiations };
}

export interface CommitmentStoreState {
  commitments: Commitment[];
  renegotiations: RenegotiationRecord[];
  isSyncing: boolean;
  lastSyncTime: number | null;

  // Actions
  addCommitment: (input: CreateCommitmentInput) => Commitment;
  markKept: (id: string, closedAt?: number) => void;
  markReleased: (id: string, closedAt?: number) => void;
  renegotiate: (id: string, revisedDueTimestamp: number, reason?: string, timestamp?: number) => void;
  deleteCommitment: (id: string) => void;

  // Selectors
  getOverdue: (now?: number) => Commitment[];
  getToday: (now?: number) => Commitment[];
  getUpcoming: (now?: number) => Commitment[];
  getReviewQueue: (now?: number) => Commitment[];
  getHistory: () => Commitment[];
  getRecentRecipients: (prefix?: string, limit?: number) => string[];

  // Supabase sync
  syncFromSupabase: () => Promise<void>;
  subscribeToRealtime: () => () => void;

  // Reset helper
  resetStore: (initialCommitments?: Commitment[], initialRenegotiations?: RenegotiationRecord[]) => void;
}

const initialSeed = createDefaultSeedData();

export const useCommitmentStore = create<CommitmentStoreState>()((set, get) => ({
  commitments: initialSeed.commitments,
  renegotiations: initialSeed.renegotiations,
  isSyncing: false,
  lastSyncTime: null,

  addCommitment: (input: CreateCommitmentInput): Commitment => {
    const now = Date.now();
    const reminderScheduledAt = computeReminderTriggerTime(input.dueTimestamp, input.reminderOffsetMinutes);

    const newCommitment: Commitment = {
      id: generateUUID(),
      userId: DEMO_USER_ID,
      recipientName: input.recipientName.trim(),
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      originalDueTimestamp: input.dueTimestamp,
      currentDueTimestamp: input.dueTimestamp,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      reminderOffsetMinutes: input.reminderOffsetMinutes ?? null,
      reminderScheduledAt,
      isArchived: false,
      isDeleted: false,
    };

    set((state) => ({
      commitments: [newCommitment, ...state.commitments],
    }));

    // Async sync to Supabase if client available
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('commitments')
        .insert({
          id: newCommitment.id,
          user_id: newCommitment.userId,
          recipient_name: newCommitment.recipientName,
          title: newCommitment.title,
          notes: newCommitment.notes,
          original_due_timestamp: newCommitment.originalDueTimestamp,
          current_due_timestamp: newCommitment.currentDueTimestamp,
          status: newCommitment.status,
          created_at: newCommitment.createdAt,
          updated_at: newCommitment.updatedAt,
          closed_at: newCommitment.closedAt,
          reminder_offset_minutes: newCommitment.reminderOffsetMinutes,
          reminder_scheduled_at: newCommitment.reminderScheduledAt,
          is_archived: newCommitment.isArchived,
          is_deleted: newCommitment.isDeleted,
        })
        .then(({ error }) => {
          if (error) console.error('[Kept] Supabase insert commitment error:', error);
        });
    }

    return newCommitment;
  },

  markKept: (id: string, closedAt?: number) => {
    const timestamp = closedAt ?? Date.now();

    set((state) => ({
      commitments: state.commitments.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'KEPT' as CommitmentStatus,
              closedAt: timestamp,
              updatedAt: timestamp,
              reminderScheduledAt: null,
            }
          : c
      ),
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('commitments')
        .update({
          status: 'KEPT',
          closed_at: timestamp,
          updated_at: timestamp,
          reminder_scheduled_at: null,
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[Kept] Supabase markKept error:', error);
        });
    }
  },

  markReleased: (id: string, closedAt?: number) => {
    const timestamp = closedAt ?? Date.now();

    set((state) => ({
      commitments: state.commitments.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'RELEASED' as CommitmentStatus,
              closedAt: timestamp,
              updatedAt: timestamp,
              reminderScheduledAt: null,
            }
          : c
      ),
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('commitments')
        .update({
          status: 'RELEASED',
          closed_at: timestamp,
          updated_at: timestamp,
          reminder_scheduled_at: null,
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[Kept] Supabase markReleased error:', error);
        });
    }
  },

  renegotiate: (id: string, revisedDueTimestamp: number, reason?: string, timestamp?: number) => {
    const now = timestamp ?? Date.now();
    const commitment = get().commitments.find((c) => c.id === id);

    if (!commitment) {
      throw new Error('Commitment not found');
    }

    if (!isActiveStatus(commitment.status)) {
      throw new Error('Cannot renegotiate a closed commitment');
    }

    // Validation: revised due date must be strictly in the future relative to now
    if (revisedDueTimestamp <= now) {
      throw new Error('Revised due date must be in the future');
    }

    const previousDue = commitment.currentDueTimestamp;
    const reminderScheduledAt = computeReminderTriggerTime(
      revisedDueTimestamp,
      commitment.reminderOffsetMinutes
    );

    const auditRecord: RenegotiationRecord = {
      id: generateUUID(),
      commitmentId: id,
      userId: commitment.userId,
      previousDueTimestamp: previousDue,
      revisedDueTimestamp,
      reason: reason?.trim() || null,
      createdAt: now,
    };

    set((state) => ({
      commitments: state.commitments.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'RENEGOTIATED' as CommitmentStatus,
              currentDueTimestamp: revisedDueTimestamp,
              reminderScheduledAt,
              updatedAt: now,
            }
          : c
      ),
      renegotiations: [auditRecord, ...state.renegotiations],
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      // Parallel update commitment & insert renegotiation audit log
      Promise.all([
        supabase
          .from('commitments')
          .update({
            status: 'RENEGOTIATED',
            current_due_timestamp: revisedDueTimestamp,
            reminder_scheduled_at: reminderScheduledAt,
            updated_at: now,
          })
          .eq('id', id),
        supabase.from('renegotiations').insert({
          id: auditRecord.id,
          commitment_id: auditRecord.commitmentId,
          user_id: auditRecord.userId,
          previous_due_timestamp: auditRecord.previousDueTimestamp,
          revised_due_timestamp: auditRecord.revisedDueTimestamp,
          reason: auditRecord.reason,
          created_at: auditRecord.createdAt,
        }),
      ]).catch((err) => console.error('[Kept] Supabase renegotiate error:', err));
    }
  },

  deleteCommitment: (id: string) => {
    set((state) => ({
      commitments: state.commitments.filter((c) => c.id !== id),
      renegotiations: state.renegotiations.filter((r) => r.commitmentId !== id),
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase
        .from('commitments')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[Kept] Supabase delete error:', error);
        });
    }
  },

  getOverdue: (now?: number): Commitment[] => {
    const referenceTime = now ?? Date.now();
    return get()
      .commitments.filter(
        (c) =>
          isActiveStatus(c.status) &&
          !c.isArchived &&
          !c.isDeleted &&
          isOverdue(c.currentDueTimestamp, referenceTime)
      )
      .sort((a, b) => a.currentDueTimestamp - b.currentDueTimestamp);
  },

  getToday: (now?: number): Commitment[] => {
    const referenceTime = now ?? Date.now();
    return get()
      .commitments.filter(
        (c) =>
          isActiveStatus(c.status) &&
          !c.isArchived &&
          !c.isDeleted &&
          isDueToday(c.currentDueTimestamp, referenceTime) &&
          !isOverdue(c.currentDueTimestamp, referenceTime)
      )
      .sort((a, b) => a.currentDueTimestamp - b.currentDueTimestamp);
  },

  getUpcoming: (now?: number): Commitment[] => {
    const referenceTime = now ?? Date.now();
    return get()
      .commitments.filter(
        (c) =>
          isActiveStatus(c.status) &&
          !c.isArchived &&
          !c.isDeleted &&
          isUpcoming(c.currentDueTimestamp, referenceTime)
      )
      .sort((a, b) => a.currentDueTimestamp - b.currentDueTimestamp);
  },

  getReviewQueue: (now?: number): Commitment[] => {
    const referenceTime = now ?? Date.now();
    const endOfDay = getEndOfDayMillis(referenceTime);
    return get()
      .commitments.filter(
        (c) =>
          isActiveStatus(c.status) &&
          !c.isArchived &&
          !c.isDeleted &&
          c.currentDueTimestamp <= endOfDay
      )
      .sort((a, b) => a.currentDueTimestamp - b.currentDueTimestamp);
  },

  getHistory: (): Commitment[] => {
    return get()
      .commitments.filter((c) => isClosedStatus(c.status) && !c.isDeleted)
      .sort((a, b) => (b.closedAt ?? b.currentDueTimestamp) - (a.closedAt ?? a.currentDueTimestamp));
  },

  getRecentRecipients: (prefix?: string, limit: number = 10): string[] => {
    const cleanPrefix = prefix?.trim().toLowerCase();
    const map = new Map<string, number>();

    // Accumulate the most recent createdAt timestamp for each recipient name
    for (const c of get().commitments) {
      if (c.isDeleted) continue;
      const name = c.recipientName.trim();
      if (!name) continue;

      if (cleanPrefix && !name.toLowerCase().startsWith(cleanPrefix)) {
        continue;
      }

      const existing = map.get(name) ?? 0;
      if (c.createdAt > existing) {
        map.set(name, c.createdAt);
      }
    }

    // Sort by latest createdAt descending
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return sorted.slice(0, limit);
  },

  syncFromSupabase: async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    set({ isSyncing: true });

    try {
      const [commitmentsRes, renegotiationsRes] = await Promise.all([
        supabase
          .from('commitments')
          .select('*')
          .eq('is_deleted', false)
          .order('current_due_timestamp', { ascending: true }),
        supabase.from('renegotiations').select('*').order('created_at', { ascending: false }),
      ]);

      if (commitmentsRes.error) {
        console.error('[Kept] Failed to fetch commitments from Supabase:', commitmentsRes.error);
      } else if (commitmentsRes.data) {
        const fetchedCommitments: Commitment[] = commitmentsRes.data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          recipientName: row.recipient_name,
          title: row.title,
          notes: row.notes,
          originalDueTimestamp: Number(row.original_due_timestamp),
          currentDueTimestamp: Number(row.current_due_timestamp),
          status: row.status as CommitmentStatus,
          createdAt: Number(row.created_at),
          updatedAt: Number(row.updated_at),
          closedAt: row.closed_at ? Number(row.closed_at) : null,
          reminderOffsetMinutes: row.reminder_offset_minutes,
          reminderScheduledAt: row.reminder_scheduled_at ? Number(row.reminder_scheduled_at) : null,
          isArchived: Boolean(row.is_archived),
          isDeleted: Boolean(row.is_deleted),
        }));

        set({ commitments: fetchedCommitments });
      }

      if (renegotiationsRes.error) {
        console.error('[Kept] Failed to fetch renegotiations from Supabase:', renegotiationsRes.error);
      } else if (renegotiationsRes.data) {
        const fetchedRenegotiations: RenegotiationRecord[] = renegotiationsRes.data.map((row) => ({
          id: row.id,
          commitmentId: row.commitment_id,
          userId: row.user_id,
          previousDueTimestamp: Number(row.previous_due_timestamp),
          revisedDueTimestamp: Number(row.revised_due_timestamp),
          reason: row.reason,
          createdAt: Number(row.created_at),
        }));

        set({ renegotiations: fetchedRenegotiations });
      }

      set({ lastSyncTime: Date.now() });
    } catch (err) {
      console.error('[Kept] Supabase sync error:', err);
    } finally {
      set({ isSyncing: false });
    }
  },

  subscribeToRealtime: () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('kept-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commitments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            const newCommitment: Commitment = {
              id: row.id,
              userId: row.user_id,
              recipientName: row.recipient_name,
              title: row.title,
              notes: row.notes,
              originalDueTimestamp: Number(row.original_due_timestamp),
              currentDueTimestamp: Number(row.current_due_timestamp),
              status: row.status as CommitmentStatus,
              createdAt: Number(row.created_at),
              updatedAt: Number(row.updated_at),
              closedAt: row.closed_at ? Number(row.closed_at) : null,
              reminderOffsetMinutes: row.reminder_offset_minutes,
              reminderScheduledAt: row.reminder_scheduled_at ? Number(row.reminder_scheduled_at) : null,
              isArchived: Boolean(row.is_archived),
              isDeleted: Boolean(row.is_deleted),
            };
            set((state) => ({
              commitments: [newCommitment, ...state.commitments.filter((c) => c.id !== newCommitment.id)],
            }));
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            set((state) => ({
              commitments: state.commitments.map((c) =>
                c.id === row.id
                  ? {
                      ...c,
                      recipientName: row.recipient_name,
                      title: row.title,
                      notes: row.notes,
                      originalDueTimestamp: Number(row.original_due_timestamp),
                      currentDueTimestamp: Number(row.current_due_timestamp),
                      status: row.status as CommitmentStatus,
                      updatedAt: Number(row.updated_at),
                      closedAt: row.closed_at ? Number(row.closed_at) : null,
                      reminderOffsetMinutes: row.reminder_offset_minutes,
                      reminderScheduledAt: row.reminder_scheduled_at ? Number(row.reminder_scheduled_at) : null,
                      isArchived: Boolean(row.is_archived),
                      isDeleted: Boolean(row.is_deleted),
                    }
                  : c
              ),
            }));
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old;
            if (row?.id) {
              set((state) => ({
                commitments: state.commitments.filter((c) => c.id !== row.id),
              }));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'renegotiations' },
        (payload) => {
          const row = payload.new;
          const newRecord: RenegotiationRecord = {
            id: row.id,
            commitmentId: row.commitment_id,
            userId: row.user_id,
            previousDueTimestamp: Number(row.previous_due_timestamp),
            revisedDueTimestamp: Number(row.revised_due_timestamp),
            reason: row.reason,
            createdAt: Number(row.created_at),
          };
          set((state) => ({
            renegotiations: [newRecord, ...state.renegotiations.filter((r) => r.id !== newRecord.id)],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  resetStore: (
    initialCommitments?: Commitment[],
    initialRenegotiations?: RenegotiationRecord[]
  ) => {
    if (initialCommitments !== undefined && initialRenegotiations !== undefined) {
      set({
        commitments: initialCommitments,
        renegotiations: initialRenegotiations,
        isSyncing: false,
        lastSyncTime: null,
      });
    } else {
      const freshSeed = createDefaultSeedData();
      set({
        commitments: freshSeed.commitments,
        renegotiations: freshSeed.renegotiations,
        isSyncing: false,
        lastSyncTime: null,
      });
    }
  },
}));
