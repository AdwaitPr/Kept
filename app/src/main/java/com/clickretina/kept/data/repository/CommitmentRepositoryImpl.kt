package com.clickretina.kept.data.repository

import androidx.room.withTransaction
import com.clickretina.kept.data.local.KeptDatabase
import com.clickretina.kept.data.local.entity.CommitmentEntity
import com.clickretina.kept.data.local.entity.RenegotiationEntity
import com.clickretina.kept.data.model.CommitmentStatus
import com.clickretina.kept.util.DateTimeUtils
import kotlinx.coroutines.flow.Flow

class CommitmentRepositoryImpl(
    private val database: KeptDatabase
) : CommitmentRepository {

    private val commitmentDao = database.commitmentDao()
    private val renegotiationDao = database.renegotiationDao()

    override suspend fun createCommitment(
        recipientName: String,
        title: String,
        notes: String?,
        dueTimestamp: Long,
        reminderOffsetMinutes: Int?,
        createdAt: Long
    ): Long {
        val reminderScheduledAt = DateTimeUtils.computeReminderTriggerTime(
            dueTimestamp = dueTimestamp,
            offsetMinutes = reminderOffsetMinutes
        )

        val entity = CommitmentEntity(
            recipientName = recipientName.trim(),
            title = title.trim(),
            notes = notes?.trim()?.ifEmpty { null },
            originalDueTimestamp = dueTimestamp,
            currentDueTimestamp = dueTimestamp,
            status = CommitmentStatus.PENDING,
            createdAt = createdAt,
            closedAt = null,
            reminderOffsetMinutes = reminderOffsetMinutes,
            reminderScheduledAt = reminderScheduledAt,
            isArchived = false
        )
        return commitmentDao.insertCommitment(entity)
    }

    override suspend fun updateCommitment(commitment: CommitmentEntity) {
        val updatedReminderScheduledAt = DateTimeUtils.computeReminderTriggerTime(
            dueTimestamp = commitment.currentDueTimestamp,
            offsetMinutes = commitment.reminderOffsetMinutes
        )
        commitmentDao.updateCommitment(
            commitment.copy(reminderScheduledAt = updatedReminderScheduledAt)
        )
    }

    override suspend fun deleteCommitment(id: Long) {
        commitmentDao.deleteCommitmentById(id)
    }

    override suspend fun getCommitment(id: Long): CommitmentEntity? {
        return commitmentDao.getCommitmentById(id)
    }

    override fun observeCommitment(id: Long): Flow<CommitmentEntity?> {
        return commitmentDao.observeCommitmentById(id)
    }

    override fun observeActiveCommitments(): Flow<List<CommitmentEntity>> {
        return commitmentDao.observeActiveCommitments()
    }

    override fun observeOverdueCommitments(nowTimestamp: Long): Flow<List<CommitmentEntity>> {
        return commitmentDao.observeOverdueCommitments(nowTimestamp)
    }

    override fun observeTodayCommitments(startTimestamp: Long, endTimestamp: Long): Flow<List<CommitmentEntity>> {
        return commitmentDao.observeCommitmentsInWindow(startTimestamp, endTimestamp)
    }

    override fun observeUpcomingCommitments(afterTimestamp: Long): Flow<List<CommitmentEntity>> {
        return commitmentDao.observeUpcomingCommitments(afterTimestamp)
    }

    override fun observeHistoryCommitments(): Flow<List<CommitmentEntity>> {
        return commitmentDao.observeHistoryCommitments()
    }

    override suspend fun markKept(id: Long, closedAt: Long): Boolean {
        val existing = commitmentDao.getCommitmentById(id) ?: return false
        commitmentDao.updateCommitment(
            existing.copy(
                status = CommitmentStatus.KEPT,
                closedAt = closedAt,
                reminderScheduledAt = null
            )
        )
        return true
    }

    override suspend fun release(id: Long, closedAt: Long): Boolean {
        val existing = commitmentDao.getCommitmentById(id) ?: return false
        commitmentDao.updateCommitment(
            existing.copy(
                status = CommitmentStatus.RELEASED,
                closedAt = closedAt,
                reminderScheduledAt = null
            )
        )
        return true
    }

    override suspend fun renegotiate(
        commitmentId: Long,
        revisedDueTimestamp: Long,
        reason: String?,
        timestamp: Long
    ): Boolean {
        return database.withTransaction {
            val existing = commitmentDao.getCommitmentById(commitmentId) ?: return@withTransaction false

            val renegotiation = RenegotiationEntity(
                commitmentId = commitmentId,
                previousDueTimestamp = existing.currentDueTimestamp,
                revisedDueTimestamp = revisedDueTimestamp,
                reason = reason?.trim()?.ifEmpty { null },
                createdAt = timestamp
            )
            renegotiationDao.insertRenegotiation(renegotiation)

            val updatedReminderScheduledAt = DateTimeUtils.computeReminderTriggerTime(
                dueTimestamp = revisedDueTimestamp,
                offsetMinutes = existing.reminderOffsetMinutes
            )

            val updatedCommitment = existing.copy(
                currentDueTimestamp = revisedDueTimestamp,
                status = CommitmentStatus.RENEGOTIATED,
                reminderScheduledAt = updatedReminderScheduledAt
            )
            commitmentDao.updateCommitment(updatedCommitment)
            true
        }
    }

    override suspend fun getRenegotiationHistory(commitmentId: Long): List<RenegotiationEntity> {
        return renegotiationDao.getRenegotiationsForCommitment(commitmentId)
    }

    override fun observeRenegotiationHistory(commitmentId: Long): Flow<List<RenegotiationEntity>> {
        return renegotiationDao.observeRenegotiationsForCommitment(commitmentId)
    }

    override suspend fun getRecipientSuggestions(prefix: String, limit: Int): List<String> {
        return commitmentDao.getRecipientSuggestions(prefix.trim(), limit)
    }

    override suspend fun getRecentRecipients(limit: Int): List<String> {
        return commitmentDao.getRecentRecipients(limit)
    }

    override suspend fun getActiveCommitmentsWithPendingReminders(nowTimestamp: Long): List<CommitmentEntity> {
        return commitmentDao.getActiveCommitmentsWithPendingReminders(nowTimestamp)
    }
}
