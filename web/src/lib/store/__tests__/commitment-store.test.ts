import { describe, it, expect, beforeEach } from 'vitest';
import { useCommitmentStore } from '../commitment-store';
import { isSupabaseConfigured, getSupabaseClient } from '../../supabase/client';
import { getStartOfDayMillis, getEndOfDayMillis } from '../../date-utils';

describe('Commitment Store & State Management', () => {
  // Use a fixed reference time for deterministic testing: Nov 14, 2026 at 12:00 PM local
  const fixedNow = new Date(2026, 10, 14, 12, 0, 0, 0).getTime();
  const startOfToday = getStartOfDayMillis(fixedNow);
  const endOfToday = getEndOfDayMillis(fixedNow);

  beforeEach(() => {
    // Reset store before each test
    useCommitmentStore.getState().resetStore();
  });

  describe('Initial State & Seed Data', () => {
    it('initializes with realistic mock commitments for immediate local demo', () => {
      const { commitments, renegotiations } = useCommitmentStore.getState();

      expect(commitments.length).toBeGreaterThanOrEqual(5);

      const overdue = commitments.filter((c) => c.status === 'PENDING' && c.currentDueTimestamp < Date.now());
      const kept = commitments.filter((c) => c.status === 'KEPT');

      expect(overdue.length).toBeGreaterThanOrEqual(1);
      expect(kept.length).toBeGreaterThanOrEqual(1);
      expect(renegotiations.length).toBeGreaterThanOrEqual(1);

      // Verify the kept item has an audit trail in renegotiations
      const keptWithAudit = kept.find((k) => renegotiations.some((r) => r.commitmentId === k.id));
      expect(keptWithAudit).toBeDefined();
    });
  });

  describe('addCommitment', () => {
    it('creates a new active commitment with PENDING status and correct initial timestamps', () => {
      const dueTimestamp = fixedNow + 3 * 60 * 60 * 1000; // in 3 hours
      const newCommitment = useCommitmentStore.getState().addCommitment({
        recipientName: 'Alice Cooper',
        title: 'Review contract proposal',
        notes: 'Pay attention to section 4',
        dueTimestamp,
        reminderOffsetMinutes: 15,
      });

      expect(newCommitment.id).toBeDefined();
      expect(typeof newCommitment.id).toBe('string');
      expect(newCommitment.recipientName).toBe('Alice Cooper');
      expect(newCommitment.title).toBe('Review contract proposal');
      expect(newCommitment.notes).toBe('Section 4'.length > 0 ? 'Pay attention to section 4' : null);
      expect(newCommitment.status).toBe('PENDING');
      expect(newCommitment.originalDueTimestamp).toBe(dueTimestamp);
      expect(newCommitment.currentDueTimestamp).toBe(dueTimestamp);
      expect(newCommitment.reminderOffsetMinutes).toBe(15);
      expect(newCommitment.reminderScheduledAt).toBe(dueTimestamp - 15 * 60 * 1000);
      expect(newCommitment.isArchived).toBe(false);
      expect(newCommitment.closedAt).toBeNull();

      // Check it was added to store state
      const state = useCommitmentStore.getState();
      const inStore = state.commitments.find((c) => c.id === newCommitment.id);
      expect(inStore).toEqual(newCommitment);
    });
  });

  describe('markKept', () => {
    it('transitions status to KEPT, records closedAt, and clears reminder schedule', () => {
      const store = useCommitmentStore.getState();
      const item = store.addCommitment({
        recipientName: 'Bob Builder',
        title: 'Deliver blueprints',
        dueTimestamp: fixedNow + 3600000,
        reminderOffsetMinutes: 60,
      });

      const closeTimestamp = fixedNow + 10000;
      store.markKept(item.id, closeTimestamp);

      const updated = useCommitmentStore.getState().commitments.find((c) => c.id === item.id);
      expect(updated?.status).toBe('KEPT');
      expect(updated?.closedAt).toBe(closeTimestamp);
      expect(updated?.reminderScheduledAt).toBeNull();
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(closeTimestamp);
    });
  });

  describe('markReleased', () => {
    it('transitions status to RELEASED, records closedAt, and clears reminder schedule', () => {
      const store = useCommitmentStore.getState();
      const item = store.addCommitment({
        recipientName: 'Charlie Brown',
        title: 'Attend lunch sync',
        dueTimestamp: fixedNow + 7200000,
        reminderOffsetMinutes: 15,
      });

      const releaseTimestamp = fixedNow + 20000;
      store.markReleased(item.id, releaseTimestamp);

      const updated = useCommitmentStore.getState().commitments.find((c) => c.id === item.id);
      expect(updated?.status).toBe('RELEASED');
      expect(updated?.closedAt).toBe(releaseTimestamp);
      expect(updated?.reminderScheduledAt).toBeNull();
    });
  });

  describe('renegotiate', () => {
    it('atomically updates commitment due date, sets RENEGOTIATED status, and creates audit log', () => {
      const store = useCommitmentStore.getState();
      const originalDue = fixedNow + 3600000;
      const item = store.addCommitment({
        recipientName: 'Diana Prince',
        title: 'Provide budget approval',
        dueTimestamp: originalDue,
        reminderOffsetMinutes: 15,
      });

      const revisedDue = fixedNow + 86400000; // tomorrow
      const renegotiateTime = fixedNow + 5000;
      const reason = 'Waiting for finance director sign-off';

      store.renegotiate(item.id, revisedDue, reason, renegotiateTime);

      const updatedCommitment = useCommitmentStore.getState().commitments.find((c) => c.id === item.id);
      expect(updatedCommitment?.status).toBe('RENEGOTIATED');
      expect(updatedCommitment?.originalDueTimestamp).toBe(originalDue);
      expect(updatedCommitment?.currentDueTimestamp).toBe(revisedDue);
      // Reminder scheduled time recalculated for new due date
      expect(updatedCommitment?.reminderScheduledAt).toBe(revisedDue - 15 * 60 * 1000);

      // Verify audit history record created
      const auditRecords = useCommitmentStore.getState().renegotiations.filter((r) => r.commitmentId === item.id);
      expect(auditRecords.length).toBe(1);
      const record = auditRecords[0];
      expect(record.commitmentId).toBe(item.id);
      expect(record.previousDueTimestamp).toBe(originalDue);
      expect(record.revisedDueTimestamp).toBe(revisedDue);
      expect(record.reason).toBe(reason);
      expect(record.createdAt).toBe(renegotiateTime);
    });

    it('rejects renegotiation with error if revisedDue is not strictly in the future relative to now', () => {
      const store = useCommitmentStore.getState();
      const item = store.addCommitment({
        recipientName: 'Diana',
        title: 'Task',
        dueTimestamp: fixedNow + 100000,
      });

      // Try setting revised due in the past relative to fixedNow
      expect(() => {
        store.renegotiate(item.id, fixedNow - 1000, 'Invalid past time', fixedNow);
      }).toThrow('Revised due date must be in the future');

      // Try setting revised due equal to now
      expect(() => {
        store.renegotiate(item.id, fixedNow, 'Invalid exact current time', fixedNow);
      }).toThrow('Revised due date must be in the future');
    });

    it('rejects attempting to renegotiate an overdue commitment to a past timestamp', () => {
      const store = useCommitmentStore.getState();
      // Overdue commitment with past due timestamp
      const overdueDue = fixedNow - 3600000; // 1 hour ago
      const item = store.addCommitment({
        recipientName: 'Diana Overdue',
        title: 'Overdue task',
        dueTimestamp: overdueDue,
      });

      // Attempt to renegotiate to another past timestamp (e.g., 30 minutes ago, which is > overdueDue but <= fixedNow)
      const pastRevisedDue = fixedNow - 1800000;
      expect(() => {
        store.renegotiate(item.id, pastRevisedDue, 'Still in past', fixedNow);
      }).toThrow('Revised due date must be in the future');
    });

    it('rejects attempting to renegotiate a closed commitment (KEPT or RELEASED)', () => {
      const store = useCommitmentStore.getState();
      const item1 = store.addCommitment({
        recipientName: 'George Kept',
        title: 'Kept commitment',
        dueTimestamp: fixedNow + 50000,
      });
      store.markKept(item1.id, fixedNow);

      expect(() => {
        store.renegotiate(item1.id, fixedNow + 100000, 'Try renegotiating kept', fixedNow);
      }).toThrow('Cannot renegotiate a closed commitment');

      const item2 = store.addCommitment({
        recipientName: 'Hannah Released',
        title: 'Released commitment',
        dueTimestamp: fixedNow + 50000,
      });
      store.markReleased(item2.id, fixedNow);

      expect(() => {
        store.renegotiate(item2.id, fixedNow + 100000, 'Try renegotiating released', fixedNow);
      }).toThrow('Cannot renegotiate a closed commitment');
    });

    it('throws error when renegotiating a non-existent commitment', () => {
      const store = useCommitmentStore.getState();
      expect(() => {
        store.renegotiate('non-existent-id', fixedNow + 50000, 'Some reason');
      }).toThrow('Commitment not found');
    });
  });

  describe('deleteCommitment', () => {
    it('removes commitment from active state and cleans up associated renegotiations', () => {
      const store = useCommitmentStore.getState();
      const item = store.addCommitment({
        recipientName: 'Frank Castle',
        title: 'Temporary item',
        dueTimestamp: fixedNow + 10000,
      });

      store.renegotiate(item.id, fixedNow + 50000, 'Need more time', fixedNow + 1000);
      expect(useCommitmentStore.getState().renegotiations.some((r) => r.commitmentId === item.id)).toBe(true);

      store.deleteCommitment(item.id);

      expect(useCommitmentStore.getState().commitments.some((c) => c.id === item.id)).toBe(false);
      expect(useCommitmentStore.getState().renegotiations.some((r) => r.commitmentId === item.id)).toBe(false);
    });
  });

  describe('Selectors: Overdue, Today, Upcoming, History', () => {
    beforeEach(() => {
      // Seed with custom fixed timestamps around fixedNow (Nov 14, 2026, 12:00 PM)
      useCommitmentStore.getState().resetStore(
        [
          // Overdue: yesterday
          {
            id: 'c-overdue-1',
            userId: 'user-1',
            recipientName: 'Sarah',
            title: 'Overdue yesterday',
            originalDueTimestamp: fixedNow - 86400000,
            currentDueTimestamp: fixedNow - 86400000,
            status: 'PENDING',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 100000000,
            closedAt: null,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // Overdue: earlier today (e.g. 9:00 AM)
          {
            id: 'c-overdue-2',
            userId: 'user-1',
            recipientName: 'Marcus',
            title: 'Overdue earlier today',
            originalDueTimestamp: fixedNow - 3 * 3600000,
            currentDueTimestamp: fixedNow - 3 * 3600000,
            status: 'PENDING',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 100000000,
            closedAt: null,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // Today: later today (e.g. 3:00 PM)
          {
            id: 'c-today-1',
            userId: 'user-1',
            recipientName: 'Elena',
            title: 'Due today at 3pm',
            originalDueTimestamp: fixedNow + 3 * 3600000,
            currentDueTimestamp: fixedNow + 3 * 3600000,
            status: 'PENDING',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 100000000,
            closedAt: null,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // Today: later today (e.g. 8:00 PM)
          {
            id: 'c-today-2',
            userId: 'user-1',
            recipientName: 'David',
            title: 'Due today at 8pm',
            originalDueTimestamp: fixedNow + 8 * 3600000,
            currentDueTimestamp: fixedNow + 8 * 3600000,
            status: 'RENEGOTIATED',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 100000000,
            closedAt: null,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // Upcoming: tomorrow
          {
            id: 'c-upcoming-1',
            userId: 'user-1',
            recipientName: 'Amara',
            title: 'Due tomorrow',
            originalDueTimestamp: fixedNow + 86400000,
            currentDueTimestamp: fixedNow + 86400000,
            status: 'PENDING',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 100000000,
            closedAt: null,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // Upcoming: in 5 days
          {
            id: 'c-upcoming-2',
            userId: 'user-1',
            recipientName: 'Ken',
            title: 'Due in 5 days',
            originalDueTimestamp: fixedNow + 5 * 86400000,
            currentDueTimestamp: fixedNow + 5 * 86400000,
            status: 'PENDING',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 100000000,
            closedAt: null,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // History: KEPT
          {
            id: 'c-history-kept',
            userId: 'user-1',
            recipientName: 'Zoe',
            title: 'Delivered presentation',
            originalDueTimestamp: fixedNow - 50000000,
            currentDueTimestamp: fixedNow - 50000000,
            status: 'KEPT',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 40000000,
            closedAt: fixedNow - 40000000,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
          // History: RELEASED
          {
            id: 'c-history-released',
            userId: 'user-1',
            recipientName: 'Victor',
            title: 'Coffee catchup',
            originalDueTimestamp: fixedNow - 60000000,
            currentDueTimestamp: fixedNow - 60000000,
            status: 'RELEASED',
            createdAt: fixedNow - 100000000,
            updatedAt: fixedNow - 30000000,
            closedAt: fixedNow - 30000000,
            reminderOffsetMinutes: 0,
            reminderScheduledAt: null,
            isArchived: false,
          },
        ],
        []
      );
    });

    it('getOverdue returns active commitments with currentDueTimestamp < now sorted ascending', () => {
      const overdue = useCommitmentStore.getState().getOverdue(fixedNow);
      expect(overdue.map((c) => c.id)).toEqual(['c-overdue-1', 'c-overdue-2']);
    });

    it('getToday returns active commitments due today and not overdue', () => {
      const today = useCommitmentStore.getState().getToday(fixedNow);
      expect(today.map((c) => c.id)).toEqual(['c-today-1', 'c-today-2']);
    });

    it('getUpcoming returns active commitments maturing after today sorted ascending', () => {
      const upcoming = useCommitmentStore.getState().getUpcoming(fixedNow);
      expect(upcoming.map((c) => c.id)).toEqual(['c-upcoming-1', 'c-upcoming-2']);
    });

    it('getHistory returns resolved commitments ordered by closedAt descending', () => {
      const history = useCommitmentStore.getState().getHistory();
      expect(history.map((c) => c.id)).toEqual(['c-history-released', 'c-history-kept']);
    });
  });

  describe('Recipient Autocomplete (Zero Contact Scraping)', () => {
    beforeEach(() => {
      useCommitmentStore.getState().resetStore(
        [
          {
            id: '1',
            userId: 'u1',
            recipientName: 'Sarah Chen',
            title: 'Task 1',
            originalDueTimestamp: fixedNow,
            currentDueTimestamp: fixedNow,
            status: 'PENDING',
            createdAt: 1000,
            updatedAt: 1000,
            isArchived: false,
          },
          {
            id: '2',
            userId: 'u1',
            recipientName: 'Sam Altman',
            title: 'Task 2',
            originalDueTimestamp: fixedNow,
            currentDueTimestamp: fixedNow,
            status: 'PENDING',
            createdAt: 2000,
            updatedAt: 2000,
            isArchived: false,
          },
          {
            id: '3',
            userId: 'u1',
            recipientName: 'Sarah Chen',
            title: 'Task 3',
            originalDueTimestamp: fixedNow,
            currentDueTimestamp: fixedNow,
            status: 'KEPT',
            createdAt: 3000,
            updatedAt: 3000,
            isArchived: false,
          },
          {
            id: '4',
            userId: 'u1',
            recipientName: 'Alexander Hamilton',
            title: 'Task 4',
            originalDueTimestamp: fixedNow,
            currentDueTimestamp: fixedNow,
            status: 'PENDING',
            createdAt: 4000,
            updatedAt: 4000,
            isArchived: false,
          },
        ],
        []
      );
    });

    it('returns unique recipients ordered by most recent commitment', () => {
      const all = useCommitmentStore.getState().getRecentRecipients();
      expect(all).toEqual(['Alexander Hamilton', 'Sarah Chen', 'Sam Altman']);
    });

    it('filters recipients by prefix case-insensitively and respects limit', () => {
      const suggestions = useCommitmentStore.getState().getRecentRecipients('sa', 5);
      expect(suggestions).toEqual(['Sarah Chen', 'Sam Altman']);

      const single = useCommitmentStore.getState().getRecentRecipients('sa', 1);
      expect(single).toEqual(['Sarah Chen']);
    });
  });

  describe('Supabase Client Fallback & Offline Mode', () => {
    it('isSupabaseConfigured returns false when env vars are missing or unconfigured', () => {
      expect(isSupabaseConfigured()).toBe(false);
      expect(getSupabaseClient()).toBeNull();
    });

    it('syncFromSupabase completes gracefully in offline mock mode without error', async () => {
      const store = useCommitmentStore.getState();
      await expect(store.syncFromSupabase()).resolves.not.toThrow();
      expect(useCommitmentStore.getState().isSyncing).toBe(false);
    });

    it('subscribeToRealtime returns a no-op cleanup function in offline mock mode', () => {
      const store = useCommitmentStore.getState();
      const unsubscribe = store.subscribeToRealtime();
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
