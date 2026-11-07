package com.clickretina.kept.data.local

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import app.cash.turbine.test
import com.clickretina.kept.data.local.dao.CommitmentDao
import com.clickretina.kept.data.local.dao.RenegotiationDao
import com.clickretina.kept.data.local.entity.CommitmentEntity
import com.clickretina.kept.data.local.entity.RenegotiationEntity
import com.clickretina.kept.data.model.CommitmentStatus
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
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
class CommitmentDaoTest {

    private lateinit var database: KeptDatabase
    private lateinit var commitmentDao: CommitmentDao
    private lateinit var renegotiationDao: RenegotiationDao

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, KeptDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        commitmentDao = database.commitmentDao()
        renegotiationDao = database.renegotiationDao()
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun insertAndRetrieveCommitmentById() = runTest {
        val entity = CommitmentEntity(
            recipientName = "Alice",
            title = "Send project proposal",
            notes = "Include budget breakdown",
            originalDueTimestamp = 1731000000000L,
            currentDueTimestamp = 1731000000000L,
            status = CommitmentStatus.PENDING,
            createdAt = 1730900000000L,
            reminderOffsetMinutes = 0,
            reminderScheduledAt = 1731000000000L
        )

        val id = commitmentDao.insertCommitment(entity)
        assertTrue(id > 0)

        val retrieved = commitmentDao.getCommitmentById(id)
        assertNotNull(retrieved)
        assertEquals("Alice", retrieved?.recipientName)
        assertEquals("Send project proposal", retrieved?.title)
        assertEquals(CommitmentStatus.PENDING, retrieved?.status)
    }

    @Test
    fun observeActiveCommitmentsFiltersOutClosed() = runTest {
        val pending = CommitmentEntity(
            recipientName = "Bob",
            title = "Call about contract",
            originalDueTimestamp = 1000L,
            currentDueTimestamp = 1000L,
            status = CommitmentStatus.PENDING,
            createdAt = 100L
        )
        val renegotiated = CommitmentEntity(
            recipientName = "Charlie",
            title = "Send designs",
            originalDueTimestamp = 1000L,
            currentDueTimestamp = 2000L,
            status = CommitmentStatus.RENEGOTIATED,
            createdAt = 200L
        )
        val kept = CommitmentEntity(
            recipientName = "Dave",
            title = "Review PR",
            originalDueTimestamp = 500L,
            currentDueTimestamp = 500L,
            status = CommitmentStatus.KEPT,
            closedAt = 600L,
            createdAt = 50L
        )
        val released = CommitmentEntity(
            recipientName = "Eve",
            title = "Coffee meetup",
            originalDueTimestamp = 800L,
            currentDueTimestamp = 800L,
            status = CommitmentStatus.RELEASED,
            closedAt = 850L,
            createdAt = 70L
        )

        commitmentDao.insertCommitment(pending)
        commitmentDao.insertCommitment(renegotiated)
        commitmentDao.insertCommitment(kept)
        commitmentDao.insertCommitment(released)

        commitmentDao.observeActiveCommitments().test {
            val activeList = awaitItem()
            assertEquals(2, activeList.size)
            assertEquals("Bob", activeList[0].recipientName)
            assertEquals("Charlie", activeList[1].recipientName)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun observeOverdueCommitmentsReturnsOnlyPastDueActive() = runTest {
        val overdue = CommitmentEntity(
            recipientName = "Frank",
            title = "Deliver invoice",
            originalDueTimestamp = 1000L,
            currentDueTimestamp = 1000L,
            status = CommitmentStatus.PENDING,
            createdAt = 100L
        )
        val future = CommitmentEntity(
            recipientName = "Grace",
            title = "Weekly status report",
            originalDueTimestamp = 5000L,
            currentDueTimestamp = 5000L,
            status = CommitmentStatus.PENDING,
            createdAt = 100L
        )

        commitmentDao.insertCommitment(overdue)
        commitmentDao.insertCommitment(future)

        commitmentDao.observeOverdueCommitments(nowTimestamp = 3000L).test {
            val overdueList = awaitItem()
            assertEquals(1, overdueList.size)
            assertEquals("Frank", overdueList[0].recipientName)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun foreignKeyCascadeDeletesRenegotiationsWhenCommitmentDeleted() = runTest {
        val commitment = CommitmentEntity(
            recipientName = "Helen",
            title = "Submit quarterly review",
            originalDueTimestamp = 1000L,
            currentDueTimestamp = 2000L,
            status = CommitmentStatus.RENEGOTIATED,
            createdAt = 500L
        )
        val commitmentId = commitmentDao.insertCommitment(commitment)

        val renegotiation = RenegotiationEntity(
            commitmentId = commitmentId,
            previousDueTimestamp = 1000L,
            revisedDueTimestamp = 2000L,
            reason = "Awaiting feedback",
            createdAt = 1500L
        )
        renegotiationDao.insertRenegotiation(renegotiation)

        val recordsBefore = renegotiationDao.getRenegotiationsForCommitment(commitmentId)
        assertEquals(1, recordsBefore.size)

        // Delete parent commitment
        commitmentDao.deleteCommitmentById(commitmentId)

        // Assert cascade deletion
        val recordsAfter = renegotiationDao.getRenegotiationsForCommitment(commitmentId)
        assertTrue(recordsAfter.isEmpty())
        assertNull(commitmentDao.getCommitmentById(commitmentId))
    }

    @Test
    fun recipientSuggestionsQueryReturnsDistinctMatches() = runTest {
        commitmentDao.insertCommitment(
            CommitmentEntity(recipientName = "Sarah Connor", title = "Promise 1", originalDueTimestamp = 10L, currentDueTimestamp = 10L, createdAt = 100L)
        )
        commitmentDao.insertCommitment(
            CommitmentEntity(recipientName = "Sam Smith", title = "Promise 2", originalDueTimestamp = 20L, currentDueTimestamp = 20L, createdAt = 200L)
        )
        commitmentDao.insertCommitment(
            CommitmentEntity(recipientName = "Sarah Connor", title = "Promise 3", originalDueTimestamp = 30L, currentDueTimestamp = 30L, createdAt = 300L)
        )
        commitmentDao.insertCommitment(
            CommitmentEntity(recipientName = "Alex", title = "Promise 4", originalDueTimestamp = 40L, currentDueTimestamp = 40L, createdAt = 400L)
        )

        val suggestions = commitmentDao.getRecipientSuggestions(prefix = "Sa", limit = 5)
        assertEquals(2, suggestions.size)
        // Most recent first: Sarah Connor (created at 300L), then Sam Smith (200L)
        assertEquals("Sarah Connor", suggestions[0])
        assertEquals("Sam Smith", suggestions[1])
    }
}
