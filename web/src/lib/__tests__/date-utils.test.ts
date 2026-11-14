import { describe, it, expect } from "vitest";
import {
  formatDueDate,
  getStartOfDayMillis,
  getEndOfDayMillis,
  isOverdue,
  isDueToday,
  isUpcoming,
  computeReminderTriggerTime,
  formatTimeOnly,
  formatDateOnly,
} from "../date-utils";

describe("DateTimeUtils for Kept Web", () => {
  // Use a fixed reference point: Nov 14, 2026 at 14:30:00 local time
  const fixedNow = new Date(2026, 10, 14, 14, 30, 0, 0).getTime();

  describe("getStartOfDayMillis", () => {
    it("returns midnight (00:00:00.000) of the local day", () => {
      const afternoon = new Date(2026, 10, 14, 14, 30, 0).getTime();
      const startOfDay = getStartOfDayMillis(afternoon);
      const startDate = new Date(startOfDay);

      expect(startDate.getFullYear()).toBe(2026);
      expect(startDate.getMonth()).toBe(10);
      expect(startDate.getDate()).toBe(14);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getMilliseconds()).toBe(0);
    });

    it("returns the same start of day regardless of time within the day", () => {
      const morning = new Date(2026, 10, 14, 1, 15, 0).getTime();
      const night = new Date(2026, 10, 14, 23, 45, 0).getTime();

      expect(getStartOfDayMillis(morning)).toBe(getStartOfDayMillis(night));
    });
  });

  describe("getEndOfDayMillis", () => {
    it("returns end of the local day (23:59:59.999)", () => {
      const afternoon = new Date(2026, 10, 14, 14, 30, 0).getTime();
      const endOfDay = getEndOfDayMillis(afternoon);
      const endDate = new Date(endOfDay);

      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(10);
      expect(endDate.getDate()).toBe(14);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
      expect(endDate.getMilliseconds()).toBe(999);
    });
  });

  describe("isOverdue", () => {
    it("identifies past due dates as overdue", () => {
      const pastDue = fixedNow - 1000;
      expect(isOverdue(pastDue, fixedNow)).toBe(true);
    });

    it("identifies future due dates as not overdue", () => {
      const futureDue = fixedNow + 1000;
      expect(isOverdue(futureDue, fixedNow)).toBe(false);
    });

    it("treats exact current time as not overdue", () => {
      expect(isOverdue(fixedNow, fixedNow)).toBe(false);
    });
  });

  describe("isDueToday", () => {
    it("returns true for timestamps falling within the reference day", () => {
      const morningToday = new Date(2026, 10, 14, 9, 0, 0).getTime();
      const eveningToday = new Date(2026, 10, 14, 21, 0, 0).getTime();

      expect(isDueToday(morningToday, fixedNow)).toBe(true);
      expect(isDueToday(eveningToday, fixedNow)).toBe(true);
      expect(isDueToday(fixedNow, fixedNow)).toBe(true);
    });

    it("returns false for yesterday and tomorrow", () => {
      const yesterday = new Date(2026, 10, 13, 23, 59, 59).getTime();
      const tomorrow = new Date(2026, 10, 15, 0, 0, 1).getTime();

      expect(isDueToday(yesterday, fixedNow)).toBe(false);
      expect(isDueToday(tomorrow, fixedNow)).toBe(false);
    });
  });

  describe("isUpcoming", () => {
    it("returns true for timestamps maturing after today", () => {
      const tomorrow = new Date(2026, 10, 15, 10, 0, 0).getTime();
      const nextWeek = new Date(2026, 10, 21, 14, 0, 0).getTime();

      expect(isUpcoming(tomorrow, fixedNow)).toBe(true);
      expect(isUpcoming(nextWeek, fixedNow)).toBe(true);
    });

    it("returns false for timestamps occurring today or in the past", () => {
      const todayLater = new Date(2026, 10, 14, 18, 0, 0).getTime();
      const yesterday = new Date(2026, 10, 13, 14, 0, 0).getTime();

      expect(isUpcoming(todayLater, fixedNow)).toBe(false);
      expect(isUpcoming(yesterday, fixedNow)).toBe(false);
    });
  });

  describe("computeReminderTriggerTime", () => {
    const due = fixedNow;

    it("calculates exact time for 0 minutes offset", () => {
      expect(computeReminderTriggerTime(due, 0)).toBe(due);
    });

    it("calculates 15 minutes before due time", () => {
      expect(computeReminderTriggerTime(due, 15)).toBe(due - 15 * 60 * 1000);
    });

    it("calculates 1 hour before due time", () => {
      expect(computeReminderTriggerTime(due, 60)).toBe(due - 60 * 60 * 1000);
    });

    it("calculates 1 day before due time", () => {
      expect(computeReminderTriggerTime(due, 1440)).toBe(due - 1440 * 60 * 1000);
    });

    it("returns null when offset is null or undefined", () => {
      expect(computeReminderTriggerTime(due, null)).toBeNull();
      expect(computeReminderTriggerTime(due, undefined)).toBeNull();
    });
  });

  describe("formatDueDate", () => {
    it("formats today future time as 'Today, h:mm a'", () => {
      const todayLater = new Date(2026, 10, 14, 17, 0, 0).getTime();
      expect(formatDueDate(todayLater, fixedNow)).toBe("Today, 5:00 PM");
    });

    it("formats tomorrow time as 'Tomorrow, h:mm a'", () => {
      const tomorrow = new Date(2026, 10, 15, 10, 0, 0).getTime();
      expect(formatDueDate(tomorrow, fixedNow)).toBe("Tomorrow, 10:00 AM");
    });

    it("formats overdue yesterday as 'Overdue (Yesterday, h:mm a)'", () => {
      const yesterday = new Date(2026, 10, 13, 17, 0, 0).getTime();
      expect(formatDueDate(yesterday, fixedNow)).toBe("Overdue (Yesterday, 5:00 PM)");
    });

    it("formats overdue today earlier as 'Overdue (Today, h:mm a)'", () => {
      const earlierToday = new Date(2026, 10, 14, 10, 0, 0).getTime();
      expect(formatDueDate(earlierToday, fixedNow)).toBe("Overdue (Today, 10:00 AM)");
    });

    it("formats upcoming date in same year as 'MMM d, h:mm a'", () => {
      const future = new Date(2026, 10, 18, 14, 0, 0).getTime();
      expect(formatDueDate(future, fixedNow)).toBe("Nov 18, 2:00 PM");
    });

    it("formats overdue older date as 'Overdue (MMM d, h:mm a)'", () => {
      const past = new Date(2026, 10, 10, 14, 0, 0).getTime();
      expect(formatDueDate(past, fixedNow)).toBe("Overdue (Nov 10, 2:00 PM)");
    });

    it("formats date in a different year including the year", () => {
      const nextYear = new Date(2027, 0, 5, 15, 0, 0).getTime();
      expect(formatDueDate(nextYear, fixedNow)).toBe("Jan 5, 2027, 3:00 PM");
    });
  });

  describe("helper formatters", () => {
    it("formats time correctly with formatTimeOnly", () => {
      const time = new Date(2026, 10, 14, 17, 5, 0).getTime();
      expect(formatTimeOnly(time)).toBe("5:05 PM");
    });

    it("formats date correctly with formatDateOnly", () => {
      const date = new Date(2026, 10, 14, 17, 5, 0).getTime();
      expect(formatDateOnly(date)).toBe("Nov 14, 2026");
    });
  });
});
