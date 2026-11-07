package com.clickretina.kept.data.repository

import com.clickretina.kept.data.local.entity.CommitmentEntity
import com.clickretina.kept.data.local.entity.RenegotiationEntity
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing interpersonal commitments and their renegotiation history.
 */
interface CommitmentRepository {

    suspend fun createCommitment(
        recipientName: String,
        title: String,
        notes: String?,
        dueTimestamp: Long,
        reminderOffsetMinutes: Int?,
        createdAt: Long = System.currentTimeMillis()
    ): Long

    suspend fun updateCommitment(commitment: CommitmentEntity)

    suspend fun deleteCommitment(id: Long)

    suspend fun getCommitment(id: Long): CommitmentEntity?

    fun observeCommitment(id: Long): Flow<CommitmentEntity?>

    fun observeActiveCommitments(): Flow<List<CommitmentEntity>>

    fun observeOverdueCommitments(nowTimestamp: Long): Flow<List<CommitmentEntity>>

    fun observeTodayCommitments(startTimestamp: Long, endTimestamp: Long): Flow<List<CommitmentEntity>>

    fun observeUpcomingCommitments(afterTimestamp: Long): Flow<List<CommitmentEntity>>

    fun observeHistoryCommitments(): Flow<List<CommitmentEntity>>

    suspend fun markKept(id: Long, closedAt: Long = System.currentTimeMillis()): Boolean

    suspend fun release(id: Long, closedAt: Long = System.currentTimeMillis()): Boolean

    /**
     * Atomically revises the commitment deadline, updates status to RENEGOTIATED,
     * and appends a record to the renegotiation history log.
     */
    suspend fun renegotiate(
        commitmentId: Long,
        revisedDueTimestamp: Long,
        reason: String?,
        timestamp: Long = System.currentTimeMillis()
    ): Boolean

    suspend fun getRenegotiationHistory(commitmentId: Long): List<RenegotiationEntity>

    fun observeRenegotiationHistory(commitmentId: Long): Flow<List<RenegotiationEntity>>

    suspend fun getRecipientSuggestions(prefix: String, limit: Int = 5): List<String>

    suspend fun getRecentRecipients(limit: Int = 10): List<String>

    suspend fun getActiveCommitmentsWithPendingReminders(nowTimestamp: Long): List<CommitmentEntity>
}
