package com.clickretina.kept.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

class DateTimeUtilsTest {

    private val fixedZone = ZoneId.of("Asia/Kolkata") // UTC+05:30
    // Fixed instant: 2026-11-08 14:30:00 local time (UTC 09:00:00)
    private val fixedInstant = Instant.parse("2026-11-08T09:00:00Z")
    private val fixedClock = Clock.fixed(fixedInstant, fixedZone)

    @Test
    fun `toLocalDateTime and toEpochMillis roundtrip correctly`() {
        val originalEpoch = fixedInstant.toEpochMilli()
        val localDateTime = DateTimeUtils.toLocalDateTime(originalEpoch, fixedZone)

        assertEquals(2026, localDateTime.year)
        assertEquals(11, localDateTime.monthValue)
        assertEquals(8, localDateTime.dayOfMonth)
        assertEquals(14, localDateTime.hour)
        assertEquals(30, localDateTime.minute)

        val recoveredEpoch = DateTimeUtils.toEpochMillis(localDateTime, fixedZone)
        assertEquals(originalEpoch, recoveredEpoch)
    }

    @Test
    fun `getStartOfDay returns midnight instant of the same local day`() {
        val epochMillis = fixedInstant.toEpochMilli()
        val startOfDay = DateTimeUtils.getStartOfDay(epochMillis, fixedZone)

        val localStart = DateTimeUtils.toLocalDateTime(startOfDay, fixedZone)
        assertEquals(0, localStart.hour)
        assertEquals(0, localStart.minute)
        assertEquals(0, localStart.second)
        assertEquals(0, localStart.nano)
        assertEquals(8, localStart.dayOfMonth)
    }

    @Test
    fun `getEndOfDay returns 23h 59m 59s 999ms of the same local day`() {
        val epochMillis = fixedInstant.toEpochMilli()
        val endOfDay = DateTimeUtils.getEndOfDay(epochMillis, fixedZone)

        val localEnd = DateTimeUtils.toLocalDateTime(endOfDay, fixedZone)
        assertEquals(23, localEnd.hour)
        assertEquals(59, localEnd.minute)
        assertEquals(59, localEnd.second)
        assertEquals(8, localEnd.dayOfMonth)
    }

    @Test
    fun `isToday correctly identifies same day vs different days`() {
        val todayEpoch = fixedInstant.toEpochMilli()
        assertTrue(DateTimeUtils.isToday(todayEpoch, fixedClock))

        // 1 day in future
        val tomorrowEpoch = fixedInstant.plusSeconds(86400).toEpochMilli()
        assertFalse(DateTimeUtils.isToday(tomorrowEpoch, fixedClock))

        // 1 day in past
        val yesterdayEpoch = fixedInstant.minusSeconds(86400).toEpochMilli()
        assertFalse(DateTimeUtils.isToday(yesterdayEpoch, fixedClock))
    }

    @Test
    fun `isOverdue correctly evaluates relative to reference timestamp`() {
        val now = fixedInstant.toEpochMilli()
        val pastDue = now - 1000L
        val futureDue = now + 1000L

        assertTrue(DateTimeUtils.isOverdue(pastDue, now))
        assertFalse(DateTimeUtils.isOverdue(futureDue, now))
        assertFalse(DateTimeUtils.isOverdue(now, now))
    }

    @Test
    fun `computeReminderTriggerTime calculates correct offset`() {
        val due = fixedInstant.toEpochMilli()

        // At due time (0 mins)
        assertEquals(due, DateTimeUtils.computeReminderTriggerTime(due, 0))

        // 15 minutes before
        val expected15m = due - (15 * 60 * 1000L)
        assertEquals(expected15m, DateTimeUtils.computeReminderTriggerTime(due, 15))

        // 1 hour before
        val expected1h = due - (60 * 60 * 1000L)
        assertEquals(expected1h, DateTimeUtils.computeReminderTriggerTime(due, 60))

        // Null offset (No reminder)
        assertNull(DateTimeUtils.computeReminderTriggerTime(due, null))
    }

    @Test
    fun `formatRelativeDateTime renders friendly strings`() {
        val now = fixedInstant.toEpochMilli()

        // Today at 2:30 PM
        val todayString = DateTimeUtils.formatRelativeDateTime(now, fixedClock)
        assertTrue(todayString.equals("Today, 2:30 PM", ignoreCase = true))

        // Tomorrow at 10:00 AM
        val tomorrowInstant = LocalDateTime.of(2026, 11, 9, 10, 0)
            .atZone(fixedZone).toInstant().toEpochMilli()
        val tomorrowString = DateTimeUtils.formatRelativeDateTime(tomorrowInstant, fixedClock)
        assertTrue(tomorrowString.equals("Tomorrow, 10:00 AM", ignoreCase = true))

        // Yesterday at 5:00 PM
        val yesterdayInstant = LocalDateTime.of(2026, 11, 7, 17, 0)
            .atZone(fixedZone).toInstant().toEpochMilli()
        val yesterdayString = DateTimeUtils.formatRelativeDateTime(yesterdayInstant, fixedClock)
        assertTrue(yesterdayString.equals("Yesterday, 5:00 PM", ignoreCase = true))
    }
}
