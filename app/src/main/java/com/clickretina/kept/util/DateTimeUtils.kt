package com.clickretina.kept.util

import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

/**
 * Utility functions for date and time calculations.
 *
 * Core Principle: All stored times are UTC epoch milliseconds.
 * All user presentations are formatted according to the device's local [ZoneId].
 */
object DateTimeUtils {

    val TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US)
    val DATE_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE, MMM d", Locale.US)
    val DATE_TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE, MMM d, h:mm a", Locale.US)

    /**
     * Converts UTC epoch milliseconds to a [LocalDateTime] in the specified [zoneId].
     */
    fun toLocalDateTime(epochMillis: Long, zoneId: ZoneId = ZoneId.systemDefault()): LocalDateTime {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), zoneId)
    }

    /**
     * Converts a local date and time in [zoneId] to UTC epoch milliseconds.
     */
    fun toEpochMillis(localDateTime: LocalDateTime, zoneId: ZoneId = ZoneId.systemDefault()): Long {
        return localDateTime.atZone(zoneId).toInstant().toEpochMilli()
    }

    /**
     * Returns UTC epoch milliseconds corresponding to the start (00:00:00.000) of the day for [epochMillis].
     */
    fun getStartOfDay(epochMillis: Long, zoneId: ZoneId = ZoneId.systemDefault()): Long {
        val localDate = Instant.ofEpochMilli(epochMillis).atZone(zoneId).toLocalDate()
        return localDate.atStartOfDay(zoneId).toInstant().toEpochMilli()
    }

    /**
     * Returns UTC epoch milliseconds corresponding to the end (23:59:59.999) of the day for [epochMillis].
     */
    fun getEndOfDay(epochMillis: Long, zoneId: ZoneId = ZoneId.systemDefault()): Long {
        val localDate = Instant.ofEpochMilli(epochMillis).atZone(zoneId).toLocalDate()
        return localDate.atTime(LocalTime.MAX).atZone(zoneId).toInstant().toEpochMilli()
    }

    /**
     * Returns UTC epoch milliseconds for the start of today based on [clock].
     */
    fun getStartOfToday(clock: Clock = Clock.systemDefaultZone()): Long {
        val today = LocalDate.now(clock)
        return today.atStartOfDay(clock.zone).toInstant().toEpochMilli()
    }

    /**
     * Returns UTC epoch milliseconds for the end of today based on [clock].
     */
    fun getEndOfToday(clock: Clock = Clock.systemDefaultZone()): Long {
        val today = LocalDate.now(clock)
        return today.atTime(LocalTime.MAX).atZone(clock.zone).toInstant().toEpochMilli()
    }

    /**
     * Checks if a given [epochMillis] falls within today based on [clock].
     */
    fun isToday(epochMillis: Long, clock: Clock = Clock.systemDefaultZone()): Boolean {
        val targetDate = Instant.ofEpochMilli(epochMillis).atZone(clock.zone).toLocalDate()
        val today = LocalDate.now(clock)
        return targetDate == today
    }

    /**
     * Checks if a commitment due at [dueTimestamp] is overdue relative to [nowTimestamp].
     */
    fun isOverdue(dueTimestamp: Long, nowTimestamp: Long): Boolean {
        return dueTimestamp < nowTimestamp
    }

    /**
     * Computes the epoch millisecond instant an alarm should fire given a [dueTimestamp]
     * and an offset in minutes (e.g. 0 for at due time, 15 for 15 minutes before).
     */
    fun computeReminderTriggerTime(dueTimestamp: Long, offsetMinutes: Int?): Long? {
        if (offsetMinutes == null) return null
        return dueTimestamp - (offsetMinutes * 60 * 1000L)
    }

    /**
     * Formats an epoch millisecond instant into a human-friendly relative string
     * e.g. "Today at 5:00 PM", "Tomorrow at 10:00 AM", "Mon, Nov 10, 4:00 PM".
     */
    fun formatRelativeDateTime(epochMillis: Long, clock: Clock = Clock.systemDefaultZone()): String {
        val zoneId = clock.zone
        val targetDate = Instant.ofEpochMilli(epochMillis).atZone(zoneId).toLocalDate()
        val targetTime = Instant.ofEpochMilli(epochMillis).atZone(zoneId).toLocalTime()
        val today = LocalDate.now(clock)

        val timeString = targetTime.format(TIME_FORMATTER)
        val daysDiff = ChronoUnit.DAYS.between(today, targetDate)

        return when {
            daysDiff == 0L -> "Today, $timeString"
            daysDiff == 1L -> "Tomorrow, $timeString"
            daysDiff == -1L -> "Yesterday, $timeString"
            daysDiff in 2..6 -> "${targetDate.format(DateTimeFormatter.ofPattern("EEEE"))}, $timeString"
            else -> "${targetDate.format(DATE_FORMATTER)}, $timeString"
        }
    }
}
