package com.clickretina.kept.data.model

/**
 * Pre-deadline reminder intervals approved for Kept.
 *
 * Default is [AT_DUE_TIME] (0 minutes before).
 */
enum class ReminderOffset(val minutesBefore: Int?, val label: String) {
    AT_DUE_TIME(0, "At due time"),
    FIFTEEN_MINUTES(15, "15 minutes before"),
    ONE_HOUR(60, "1 hour before"),
    ONE_DAY(1440, "1 day before"),
    NONE(null, "No reminder");

    companion object {
        fun fromMinutes(minutes: Int?): ReminderOffset {
            return entries.firstOrNull { it.minutesBefore == minutes } ?: NONE
        }
    }
}
