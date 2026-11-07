# Kept Architecture

## Core Architectural Principles
1. **Unidirectional Data Flow (UDF)**: UI state rendered from Room queries via StateFlow; user actions dispatched through ViewModels to UseCases and Repository.
2. **Offline-First Persistence**: Room as the single source of truth. All data resides in local SQLite.
3. **UTC Time Storage**: All timestamps stored as UTC epoch milliseconds (`Long`) to prevent clock drift and simplify timezone handling. User-facing strings format dynamically via `java.time.Instant` and `ZoneId.systemDefault()`.
4. **Relational Integrity**: Foreign key constraints with `CASCADE` deletion and atomic Room transactions ensure commitments and renegotiation logs remain consistent.
5. **Zero-Permission Privacy Guarantee**: Zero network access (`android.permission.INTERNET` omitted from merged manifest) and zero contact access (`READ_CONTACTS` omitted). Recipient suggestions are populated solely from Kept's own local commitment history.

## Data Layer Architecture (Implemented in Milestone 1)
- **Entities**:
  - `CommitmentEntity`: Primary record storing recipient name, commitment title, optional notes, `originalDueTimestamp`, `currentDueTimestamp`, `status` (`PENDING`, `RENEGOTIATED`, `KEPT`, `RELEASED`), `createdAt`, `closedAt`, `reminderOffsetMinutes`, `reminderScheduledAt`, and `isArchived`.
    - Indices: `(status, current_due_timestamp)` for fast partition queries; `(recipient_name)` for autocomplete.
  - `RenegotiationEntity`: Relational history log linked to `CommitmentEntity` via `ForeignKey.CASCADE` on `commitment_id`.
    - Stores `previousDueTimestamp`, `revisedDueTimestamp`, optional `reason`, and `createdAt`.
- **DAOs**:
  - `CommitmentDao`: Reactive `Flow` queries for active, overdue, today's window, upcoming, and closed history commitments. Distinct recent recipient suggestions grouped by recency (`MAX(created_at) DESC`).
  - `RenegotiationDao`: Operations for renegotiation audit records.
- **Database & Converters**:
  - `KeptDatabase`: Room Database (v1).
  - `Converters`: Type converters for `CommitmentStatus` enum mapping.
- **Repository**:
  - `CommitmentRepository`: Interface abstracting database operations.
  - `CommitmentRepositoryImpl`: Backed by `KeptDatabase`, executes renegotiations atomically using `database.withTransaction`.
- **Utilities**:
  - `DateTimeUtils`: UTC/Local conversions, day boundary calculations (`getStartOfDay`, `getEndOfDay`, `getStartOfToday`, `getEndOfToday`), relative formatting ("Today, 2:30 PM", "Tomorrow, 10:00 AM"), and reminder trigger calculations.
