# Kept — Native Android Architecture & Implementation Blueprint

> **Product**: Kept — Native Android Interpersonal Commitment Ledger  
> **Status**: Approved by User Directive  
> **Architecture Style**: Offline-First, Clean Architecture / MVVM, Jetpack Compose, Room

---

## 1. Product Direction & Value Proposition

Kept is a lightweight commitment ledger whose purpose is to help people remember, track, and close commitments they make to other people.

### Core Philosophy: The Relational Counterparty
Unlike generic todo apps ("clean the garage", "buy milk") where completion is arbitrary and postponed items linger indefinitely with guilt, Kept records social promises:
- Counterparty (Recipient) is first-class.
- Every commitment reaches an explicit, dignified resolution:
  - **Kept**: Fulfilled as promised.
  - **Renegotiated**: Mutual agreement on a revised deadline, preserved in an immutable audit log.
  - **Released**: The recipient excused the commitment, or circumstances made it moot.

---

## 2. Approved Architectural & Design Decisions

### Decision 1: Default Reminder Timing
- **Default**: At due time (0 minutes before).
- **Options**:
  - At due time (default)
  - 15 minutes before
  - 1 hour before
  - 1 day before
  - No reminder

### Decision 2: End-of-Day Review
- **Default Time**: 8:30 PM (20:30) local time.
- Editable via Settings / Preferences.
- Non-blocking, no mandatory onboarding.
- Handled with local time-zone and daylight saving awareness.

### Decision 3: Exact Alarm Permission Strategy
- **Approach**: Non-intrusive explanatory banner if exact alarm access is unavailable on Android 12+ (API 31+).
- Never block commitment creation if exact alarms are disallowed.
- Graceful fallback to `setAndAllowWhileIdle` (inexact window).
- Settings shortcut provided, never nagging repeatedly.
- Notification permission and exact alarm permission kept conceptually distinct.

---

## 3. Scope Boundaries & Anti-Goals

### In-Scope (MVP)
1. Manual Quick Capture (recipient, promise title, notes, due date/time, reminder offset).
2. System Share Sheet intake (`ACTION_SEND` text/plain).
3. Recipient autocomplete from local history (zero contacts permission).
4. Ledger view partitioned into Overdue, Today, and Upcoming.
5. Tri-state status machine (`PENDING`, `RENEGOTIATED`, `KEPT`, `RELEASED`).
6. Renegotiation audit trail (previous deadline, revised deadline, timestamp, optional reason).
7. End-of-Day review flow (evening triage of today's pending/overdue promises).
8. Local reminder engine (AlarmManager for commitments, WorkManager for EOD review).
9. Resolution history ledger and stats.
10. Offline-first Room database, zero cloud dependency, no internet permission in manifest.

### Anti-Goals (Out of Scope)
- No generic task-management features (subtasks, projects, priorities P1/P2/P3, kanban boards).
- No contacts permission (`READ_CONTACTS`).
- No accounts, cloud sync, or authentication.
- No messaging, SMS sending, or social feed.
- No AI/LLM assistants or heavy on-device ML.

---

## 4. System Architecture

```
com.clickretina.kept
├── data/
│   ├── local/
│   │   ├── KeptDatabase.kt
│   │   ├── dao/
│   │   │   ├── CommitmentDao.kt
│   │   │   └── RenegotiationDao.kt
│   │   └── entity/
│   │       ├── CommitmentEntity.kt
│   │       └── RenegotiationEntity.kt
│   ├── model/
│   │   ├── CommitmentStatus.kt
│   │   └── ReminderOffset.kt
│   └── repository/
│       ├── CommitmentRepository.kt
│       └── CommitmentRepositoryImpl.kt
├── domain/
│   ├── model/
│   │   ├── Commitment.kt
│   │   ├── CommitmentWithHistory.kt
│   │   └── RenegotiationRecord.kt
│   └── usecase/
│       ├── CreateCommitmentUseCase.kt
│       ├── MarkCommitmentKeptUseCase.kt
│       ├── RenegotiateCommitmentUseCase.kt
│       ├── ReleaseCommitmentUseCase.kt
│       ├── GetActiveCommitmentsUseCase.kt
│       └── GetEndOfDayReviewUseCase.kt
├── reminder/
│   ├── ReminderScheduler.kt
│   ├── AlarmManagerScheduler.kt
│   ├── ReminderReceiver.kt
│   ├── BootReceiver.kt
│   ├── PackageReplacedReceiver.kt
│   └── NotificationHelper.kt
├── review/
│   └── EndOfDayWorker.kt
├── ui/
│   ├── theme/
│   ├── navigation/
│   ├── common/
│   ├── ledger/
│   ├── capture/
│   ├── detail/
│   ├── eod/
│   └── history/
└── util/
    └── DateTimeUtils.kt
```

---

## 5. Milestone Plan

- **Milestone 1**: Core Foundation & Data Layer (Room, Entities, DAOs, Database, Repository, Time Utilities, Unit Tests).
- **Milestone 2**: State Machine & Business Logic (Domain models, Use Cases, Transitions, Testing).
- **Milestone 3**: Ledger UI & Quick Capture (Compose, Material 3, Overdue/Today/Upcoming, Bottom Sheet).
- **Milestone 4**: Detail, Renegotiation Flow & End-of-Day Review (Audit trail, Reschedule dialog, EOD triage).
- **Milestone 5**: Reminder & Scheduling Engine (AlarmManager, Notifications, BootReceiver, WorkManager).
- **Milestone 6**: Share Target Intake, Polish & Final Verification (ShareActivity, Edge-to-edge, Full Verification).
