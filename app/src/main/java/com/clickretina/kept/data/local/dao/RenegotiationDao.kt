package com.clickretina.kept.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.clickretina.kept.data.local.entity.RenegotiationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RenegotiationDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRenegotiation(renegotiation: RenegotiationEntity): Long

    @Query("""
        SELECT * FROM renegotiations 
        WHERE commitment_id = :commitmentId 
        ORDER BY created_at ASC
    """)
    suspend fun getRenegotiationsForCommitment(commitmentId: Long): List<RenegotiationEntity>

    @Query("""
        SELECT * FROM renegotiations 
        WHERE commitment_id = :commitmentId 
        ORDER BY created_at ASC
    """)
    fun observeRenegotiationsForCommitment(commitmentId: Long): Flow<List<RenegotiationEntity>>

    @Query("DELETE FROM renegotiations WHERE commitment_id = :commitmentId")
    suspend fun deleteRenegotiationsForCommitment(commitmentId: Long)
}
