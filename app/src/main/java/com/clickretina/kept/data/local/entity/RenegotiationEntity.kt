package com.clickretina.kept.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Entity capturing the immutable audit trail when a commitment is renegotiated.
 *
 * Foreign key to [CommitmentEntity] with [ForeignKey.CASCADE] ensures data cleanup
 * when the parent commitment is deleted.
 */
@Entity(
    tableName = "renegotiations",
    foreignKeys = [
        ForeignKey(
            entity = CommitmentEntity::class,
            parentColumns = ["id"],
            childColumns = ["commitment_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["commitment_id"], name = "idx_renegotiations_commitment_id")
    ]
)
data class RenegotiationEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,

    @ColumnInfo(name = "commitment_id")
    val commitmentId: Long,

    @ColumnInfo(name = "previous_due_timestamp")
    val previousDueTimestamp: Long,

    @ColumnInfo(name = "revised_due_timestamp")
    val revisedDueTimestamp: Long,

    @ColumnInfo(name = "reason")
    val reason: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: Long
)
