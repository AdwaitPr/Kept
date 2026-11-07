package com.clickretina.kept.data.model

/**
 * Explicit lifecycle status for an interpersonal commitment.
 *
 * Distinct from generic task manager states (e.g. todo/done):
 * - [PENDING]: Initial active state where the commitment has not yet reached its deadline.
 * - [RENEGOTIATED]: Active state indicating the deadline was revised by mutual understanding.
 * - [KEPT]: Terminal positive state indicating the promise was honored and closed.
 * - [RELEASED]: Terminal neutral state indicating the recipient excused the promise or it became moot.
 */
enum class CommitmentStatus {
    PENDING,
    RENEGOTIATED,
    KEPT,
    RELEASED;

    val isActive: Boolean
        get() = this == PENDING || this == RENEGOTIATED

    val isClosed: Boolean
        get() = this == KEPT || this == RELEASED
}
