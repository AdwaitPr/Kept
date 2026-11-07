package com.clickretina.kept.data.local

import androidx.room.TypeConverter
import com.clickretina.kept.data.model.CommitmentStatus

/**
 * Room type converters for non-primitive attributes.
 */
class Converters {
    @TypeConverter
    fun fromStatus(status: CommitmentStatus?): String? {
        return status?.name
    }

    @TypeConverter
    fun toStatus(value: String?): CommitmentStatus {
        return value?.let {
            try {
                CommitmentStatus.valueOf(it)
            } catch (_: IllegalArgumentException) {
                CommitmentStatus.PENDING
            }
        } ?: CommitmentStatus.PENDING
    }
}
