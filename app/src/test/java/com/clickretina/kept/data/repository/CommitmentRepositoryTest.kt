package com.clickretina.kept.data.repository

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import app.cash.turbine.test
import com.clickretina.kept.data.local.KeptDatabase
import com.clickretina.kept.data.model.CommitmentStatus
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class CommitmentRepositoryTest {

    private lateinit var database: KeptDatabase
    private lateinit var repository: CommitmentRepository

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, KeptDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        repository = CommitmentRepositoryImpl(database)
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun createCommitmentCalculatesReminderSchedule() = runTest {
        val due = 1731000000000L
        val offset = 15 // 15 mins before
        val expectedReminderTime = due - (15 * 60 * 1000L)

        val id = repository.createCommitment(
            recipientName = "John Doe",
            title = "Send monthly report",
            notes = "Include summary",
            dueTimestamp = due,
            reminderOffsetMinutes = offset,
            createdAt = 1730900000000L
        )

        val retrieved = repository.getCommitment(id)
        assertNotNull(retrieved)
        assertEquals("John Doe", retrieved?.recipientName)
        assertEquals(CommitmentStatus.PENDING, retrieved?.status)
        assertEquals(due, retrieved?.originalDueTimestamp)
        assertEquals(due, retrieved?.currentDueTimestamp)
        assertEquals(expectedReminderTime, retrieved?.reminderScheduledAt)
    }

    @Test
    fun renegotiateAtomicallyUpdatesCommitmentAndLogsHistory() = runTest {
        val initialDue = 10000L
        val id = repository.createCommitment(
            recipientName = "Client A",
            title = "Deliver prototype",
            notes = null,
            dueTimestamp = initialDue,
            reminderOffsetMinutes = 0,
            createdAt = 1000L
        )

        val revisedDue = 25000L
        val reason = "Client asked for additional mockups"
        val renegotiateTime = 5000L

        val success = repository.renegotiate(
            commitmentId = id,
            revisedDueTimestamp = revisedDue,
            reason = reason,
            timestamp = renegotiateTime
        )
        assertTrue(success)

        // Verify parent commitment was updated
        val updated = repository.getCommitment(id)
        assertNotNull(updated)
        assertEquals(CommitmentStatus.RENEGOTIATED, updated?.status)
        assertEquals(initialDue, updated?.originalDueTimestamp)
        assertEquals(revisedDue, updated?.currentDueTimestamp)
        assertEquals(revisedDue, updated?.reminderScheduledAt) // offset 0 -> fires at new due time

        // Verify renegotiation audit log entry was created
        val history = repository.getRenegotiationHistory(id)
        assertEquals(1, history.size)
        val log = history[0]
        assertEquals(id, log.commitmentId)
        assertEquals(initialDue, log.previousDueTimestamp)
        assertEquals(revisedDue, log.revisedDueTimestamp)
        assertEquals(reason, log.reason)
        assertEquals(renegotiateTime, log.createdAt)
    }

    @Test
    fun markKeptTransitionsStatusAndClearsReminder() = runTest {
        val due = 50000L
        val id = repository.createCommitment(
            recipientName = "Sarah",
            title = "Call doctor",
            notes = null,
            dueTimestamp = due,
            reminderOffsetMinutes = 0,
            createdAt = 1000L
        )

        val closeTime = 45000L
        val success = repository.markKept(id, closedAt = closeTime)
        assertTrue(success)

        val closed = repository.getCommitment(id)
        assertNotNull(closed)
        assertEquals(CommitmentStatus.KEPT, closed?.status)
        assertEquals(closeTime, closed?.closedAt)
        assertNull(closed?.reminderScheduledAt)

        // Verify it moved from active to history
        repository.observeActiveCommitments().test {
            val activeList = awaitItem()
            assertTrue(activeList.none { it.id == id })
            cancelAndIgnoreRemainingEvents()
        }

        repository.observeHistoryCommitments().test {
            val historyList = awaitItem()
            assertTrue(historyList.any { it.id == id && it.status == CommitmentStatus.KEPT })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun releaseTransitionsStatusAndClearsReminder() = runTest {
        val id = repository.createCommitment(
            recipientName = "Mark",
            title = "Attend sync",
            notes = null,
            dueTimestamp = 10000L,
            reminderOffsetMinutes = 15,
            createdAt = 1000L
        )

        val releaseTime = 8000L
        val success = repository.release(id, closedAt = releaseTime)
        assertTrue(success)

        val released = repository.getCommitment(id)
        assertNotNull(released)
        assertEquals(CommitmentStatus.RELEASED, released?.status)
        assertEquals(releaseTime, released?.closedAt)
        assertNull(released?.reminderScheduledAt)
    }

    @Test
    fun renegotiateReturnsFalseForNonExistentCommitment() = runTest {
        val success = repository.renegotiate(
            commitmentId = 99999L,
            revisedDueTimestamp = 20000L,
            reason = "Test",
            timestamp = 1000L
        )
        assertFalse(success)
    }
}
