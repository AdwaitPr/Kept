package com.clickretina.kept.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.clickretina.kept.data.model.CommitmentStatus

/**
 * Primary database entity representing an interpersonal commitment.
 *
 * All timestamps are recorded in UTC epoch milliseconds.
 */
@Entity(
    tableName = "commitments",
    indices = [
        Index(value = ["status", "current_due_timestamp"], name = "idx_commitments_status_due"),
        Index(value = ["recipient_name"], name = "idx_commitments_recipient")
    ]
)
data class CommitmentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,

    @ColumnInfo(name = "recipient_name")
    val recipientName: String,

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "notes")
    val notes: String? = null,

    @ColumnInfo(name = "original_due_timestamp")
    val originalDueTimestamp: Long,

    @ColumnInfo(name = "current_due_timestamp")
    val currentDueTimestamp: Long,

    @ColumnInfo(name = "status")
    val status: CommitmentStatus = CommitmentStatus.PENDING,

    @ColumnInfo(name = "created_at")
    val createdAt: Long,

    @ColumnInfo(name = "closed_at")
    val closedAt: Long? = null,

    @ColumnInfo(name = "reminder_offset_minutes")
    val reminderOffsetMinutes: Int? = 0,

    @ColumnInfo(name = "reminder_scheduled_at")
    val reminderScheduledAt: Long? = null,

    @ColumnInfo(name = "is_archived")
    val isArchived: Boolean = false
)
