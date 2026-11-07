package com.clickretina.kept.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.clickretina.kept.data.local.entity.CommitmentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CommitmentDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommitment(commitment: CommitmentEntity): Long

    @Update
    suspend fun updateCommitment(commitment: CommitmentEntity)

    @Delete
    suspend fun deleteCommitment(commitment: CommitmentEntity)

    @Query("DELETE FROM commitments WHERE id = :id")
    suspend fun deleteCommitmentById(id: Long)

    @Query("SELECT * FROM commitments WHERE id = :id")
    suspend fun getCommitmentById(id: Long): CommitmentEntity?

    @Query("SELECT * FROM commitments WHERE id = :id")
    fun observeCommitmentById(id: Long): Flow<CommitmentEntity?>

    /**
     * Observes all active commitments (PENDING or RENEGOTIATED), ordered chronologically by due time.
     */
    @Query("""
        SELECT * FROM commitments 
        WHERE status IN ('PENDING', 'RENEGOTIATED') AND is_archived = 0 
        ORDER BY current_due_timestamp ASC
    """)
    fun observeActiveCommitments(): Flow<List<CommitmentEntity>>

    /**
     * Observes active commitments that are overdue relative to [nowTimestamp].
     */
    @Query("""
        SELECT * FROM commitments 
        WHERE status IN ('PENDING', 'RENEGOTIATED') 
          AND current_due_timestamp < :nowTimestamp 
          AND is_archived = 0 
        ORDER BY current_due_timestamp ASC
    """)
    fun observeOverdueCommitments(nowTimestamp: Long): Flow<List<CommitmentEntity>>

    /**
     * Observes active commitments maturing within a specific time window (e.g. today).
     */
    @Query("""
        SELECT * FROM commitments 
        WHERE status IN ('PENDING', 'RENEGOTIATED') 
          AND current_due_timestamp >= :startTimestamp 
          AND current_due_timestamp <= :endTimestamp 
          AND is_archived = 0 
        ORDER BY current_due_timestamp ASC
    """)
    fun observeCommitmentsInWindow(startTimestamp: Long, endTimestamp: Long): Flow<List<CommitmentEntity>>

    /**
     * Observes active commitments maturing after a specific timestamp (e.g. tomorrow onwards).
     */
    @Query("""
        SELECT * FROM commitments 
        WHERE status IN ('PENDING', 'RENEGOTIATED') 
          AND current_due_timestamp > :afterTimestamp 
          AND is_archived = 0 
        ORDER BY current_due_timestamp ASC
    """)
    fun observeUpcomingCommitments(afterTimestamp: Long): Flow<List<CommitmentEntity>>

    /**
     * Observes resolved commitments (KEPT or RELEASED), ordered by closure time descending.
     */
    @Query("""
        SELECT * FROM commitments 
        WHERE status IN ('KEPT', 'RELEASED') AND is_archived = 0 
        ORDER BY COALESCE(closed_at, current_due_timestamp) DESC
    """)
    fun observeHistoryCommitments(): Flow<List<CommitmentEntity>>

    /**
     * Autocomplete recipient suggestions sourced solely from Kept's own local commitment history.
     * Zero contact scraping, zero READ_CONTACTS.
     */
    @Query("""
        SELECT recipient_name FROM commitments 
        WHERE recipient_name != '' AND recipient_name LIKE :prefix || '%' 
        GROUP BY recipient_name 
        ORDER BY MAX(created_at) DESC 
        LIMIT :limit
    """)
    suspend fun getRecipientSuggestions(prefix: String, limit: Int = 5): List<String>

    /**
     * Queries all recent distinct recipients.
     */
    @Query("""
        SELECT recipient_name FROM commitments 
        WHERE recipient_name != '' 
        GROUP BY recipient_name 
        ORDER BY MAX(created_at) DESC 
        LIMIT :limit
    """)
    suspend fun getRecentRecipients(limit: Int = 10): List<String>

    /**
     * Queries active commitments that have a future scheduled reminder for alarm recreation on reboot/update.
     */
    @Query("""
        SELECT * FROM commitments 
        WHERE status IN ('PENDING', 'RENEGOTIATED') 
          AND reminder_offset_minutes IS NOT NULL 
          AND reminder_scheduled_at > :nowTimestamp 
          AND is_archived = 0
    """)
    suspend fun getActiveCommitmentsWithPendingReminders(nowTimestamp: Long): List<CommitmentEntity>
}
