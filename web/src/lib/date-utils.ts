/**
 * Utility functions for date and time calculations in Kept Web.
 *
 * Core Principle: All stored timestamps are UTC epoch milliseconds.
 * All user presentations are formatted according to the user's local timezone.
 */

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const DATE_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function sanitizeSpaces(str: string): string {
  // Normalize non-breaking spaces (e.g. \u202F or \u00A0 from ICU) to standard spaces
  return str.replace(/[\u202F\u00A0]/g, " ");
}

/**
 * Returns UTC epoch milliseconds corresponding to the start (00:00:00.000) of the local day for [timestampMillis].
 */
export function getStartOfDayMillis(timestampMillis: number): number {
  const date = new Date(timestampMillis);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Returns UTC epoch milliseconds corresponding to the end (23:59:59.999) of the local day for [timestampMillis].
 */
export function getEndOfDayMillis(timestampMillis: number): number {
  const date = new Date(timestampMillis);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Checks if a commitment due at [dueTimestampMillis] is overdue relative to [nowMillis].
 */
export function isOverdue(
  dueTimestampMillis: number,
  nowMillis: number = Date.now()
): boolean {
  return dueTimestampMillis < nowMillis;
}

/**
 * Checks if a given [dueTimestampMillis] falls within the same local day as [nowMillis].
 */
export function isDueToday(
  dueTimestampMillis: number,
  nowMillis: number = Date.now()
): boolean {
  const targetDate = new Date(dueTimestampMillis);
  const nowDate = new Date(nowMillis);
  return (
    targetDate.getFullYear() === nowDate.getFullYear() &&
    targetDate.getMonth() === nowDate.getMonth() &&
    targetDate.getDate() === nowDate.getDate()
  );
}

/**
 * Checks if a commitment matures after today (i.e. strictly after the end of today).
 */
export function isUpcoming(
  dueTimestampMillis: number,
  nowMillis: number = Date.now()
): boolean {
  return dueTimestampMillis > getEndOfDayMillis(nowMillis);
}

/**
 * Computes the epoch millisecond instant an alarm/reminder should trigger given
 * a [dueTimestamp] and an [offsetMinutes] (e.g. 0 for at due time, 15 for 15 min before).
 */
export function computeReminderTriggerTime(
  dueTimestamp: number,
  offsetMinutes?: number | null
): number | null {
  if (offsetMinutes === null || offsetMinutes === undefined) {
    return null;
  }
  return dueTimestamp - offsetMinutes * 60 * 1000;
}

/**
 * Formats time only, e.g. "5:00 PM"
 */
export function formatTimeOnly(timestampMillis: number): string {
  return sanitizeSpaces(TIME_FORMATTER.format(new Date(timestampMillis)));
}

/**
 * Formats date only, e.g. "Nov 14, 2026"
 */
export function formatDateOnly(timestampMillis: number): string {
  return sanitizeSpaces(DATE_YEAR_FORMATTER.format(new Date(timestampMillis)));
}

/**
 * Formats full date and time, e.g. "Nov 14, 2026, 5:00 PM"
 */
export function formatDateTime(timestampMillis: number): string {
  return `${formatDateOnly(timestampMillis)}, ${formatTimeOnly(timestampMillis)}`;
}

/**
 * Calculates calendar day difference between target and base (target - base in days).
 */
function getCalendarDayDiff(target: Date, base: Date): number {
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  ).getTime();
  const baseMidnight = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate()
  ).getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((targetMidnight - baseMidnight) / MS_PER_DAY);
}

/**
 * Formats an epoch millisecond instant into a human-friendly relative due date string.
 * Examples:
 * - "Today, 5:00 PM"
 * - "Tomorrow, 10:00 AM"
 * - "Nov 18, 2:00 PM"
 * - "Jan 5, 2027, 3:00 PM"
 * - "Overdue (Yesterday, 5:00 PM)"
 * - "Overdue (Today, 10:00 AM)"
 * - "Overdue (Nov 10, 2:00 PM)"
 */
export function formatDueDate(
  timestampMillis: number,
  nowMillis: number = Date.now()
): string {
  const targetDate = new Date(timestampMillis);
  const nowDate = new Date(nowMillis);
  const overdue = isOverdue(timestampMillis, nowMillis);

  const timeStr = sanitizeSpaces(TIME_FORMATTER.format(targetDate));
  const daysDiff = getCalendarDayDiff(targetDate, nowDate);

  let baseStr: string;
  if (daysDiff === 0) {
    baseStr = `Today, ${timeStr}`;
  } else if (daysDiff === 1) {
    baseStr = `Tomorrow, ${timeStr}`;
  } else if (daysDiff === -1) {
    baseStr = `Yesterday, ${timeStr}`;
  } else {
    // If different year, include year
    if (targetDate.getFullYear() !== nowDate.getFullYear()) {
      const dateStr = sanitizeSpaces(DATE_YEAR_FORMATTER.format(targetDate));
      baseStr = `${dateStr}, ${timeStr}`;
    } else {
      const dateStr = sanitizeSpaces(DATE_FORMATTER.format(targetDate));
      baseStr = `${dateStr}, ${timeStr}`;
    }
  }

  if (overdue) {
    return `Overdue (${baseStr})`;
  }
  return baseStr;
}
