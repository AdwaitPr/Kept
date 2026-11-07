package com.clickretina.kept.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.clickretina.kept.data.local.dao.CommitmentDao
import com.clickretina.kept.data.local.dao.RenegotiationDao
import com.clickretina.kept.data.local.entity.CommitmentEntity
import com.clickretina.kept.data.local.entity.RenegotiationEntity

/**
 * Main Room database for Kept.
 *
 * Designed as offline-first, local-only storage.
 */
@Database(
    entities = [
        CommitmentEntity::class,
        RenegotiationEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class KeptDatabase : RoomDatabase() {

    abstract fun commitmentDao(): CommitmentDao
    abstract fun renegotiationDao(): RenegotiationDao

    companion object {
        const val DATABASE_NAME = "kept.db"

        @Volatile
        private var INSTANCE: KeptDatabase? = null

        fun getInstance(context: Context): KeptDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    KeptDatabase::class.java,
                    DATABASE_NAME
                ).build().also { INSTANCE = it }
            }
        }
    }
}
