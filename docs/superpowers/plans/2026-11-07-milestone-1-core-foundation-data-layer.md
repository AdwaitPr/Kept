# Milestone 1: Core Foundation & Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a robust, offline-first data layer for Kept using Room, Kotlin Coroutines, and Flow, with relational modeling for commitments, renegotiation audit history, recipient autocomplete, and UTC time conversions.

**Architecture:** Repository pattern backed by Room Database, strictly decoupling Room database entities from domain abstractions. Reactive `Flow` queries emit immutable lists for active, overdue, today, upcoming, and history views.

**Tech Stack:** Kotlin 2.2.10, Room 2.6.1/2.7.0, KSP, Kotlin Coroutines, JUnit 4, Turbine, AndroidX Test.

**Spec:** [docs/Kept_Architecture_Blueprint.md](docs/Kept_Architecture_Blueprint.md)

## Global Constraints
- Target SDK: 37, Min SDK: 26, Compile SDK: 37.
- Zero internet permissions in AndroidManifest.xml (must be verified in merged manifest).
- Zero `READ_CONTACTS` permission (recipient suggestions sourced only from Kept's own local history).
- All stored timestamps must be UTC epoch milliseconds (`Long`).
- Room migrations must be explicit (no destructive migrations as production shortcuts).

## Review Focus
1. Foreign key cascade: Deleting a commitment must cleanly delete all its associated renegotiation history records.
2. In-memory Room testing: All Room DAOs must be tested against an in-memory SQLite database in `app/src/test/` without needing an emulator.
3. Date/Time boundary logic: Querying "Today" or "Overdue" commitments must correctly evaluate against start/end of day instants.
4. Transactional integrity: Adding a renegotiation record and updating the parent commitment's `currentDueTimestamp` must execute atomically.
5. Autocomplete query performance: Recipient suggestion query must return distinct, non-blank strings sorted by most recent usage.

---

### Task 1: Gradle & Dependency Configuration
**Files:**
- Modify: `gradle/libs.versions.toml`
- Modify: `build.gradle.kts`
- Modify: `app/build.gradle.kts`

- [ ] **Step 1: Update version catalog with Room, KSP, and Coroutines**
- [ ] **Step 2: Apply KSP plugin in root and app build files**
- [ ] **Step 3: Add Room runtime, Room KTX, and Room compiler (via KSP)**
- [ ] **Step 4: Verify gradle sync and build**
Run: `./gradlew tasks`
Expected: BUILD SUCCESSFUL

---

### Task 2: Core Models & Status Enums
**Files:**
- Create: `app/src/main/java/com/clickretina/kept/data/model/CommitmentStatus.kt`
- Create: `app/src/main/java/com/clickretina/kept/data/model/ReminderOffset.kt`

- [ ] **Step 1: Implement `CommitmentStatus` enum**
Values: `PENDING`, `RENEGOTIATED`, `KEPT`, `RELEASED`.
- [ ] **Step 2: Implement `ReminderOffset` enum / sealed class**
Offsets: `AT_DUE_TIME` (0m), `FIFTEEN_MINUTES` (15m), `ONE_HOUR` (60m), `ONE_DAY` (1440m), `NONE` (null).

---

### Task 3: Room Database Entities
**Files:**
- Create: `app/src/main/java/com/clickretina/kept/data/local/entity/CommitmentEntity.kt`
- Create: `app/src/main/java/com/clickretina/kept/data/local/entity/RenegotiationEntity.kt`

- [ ] **Step 1: Implement `CommitmentEntity`**
Fields: `id`, `recipientName`, `title`, `notes`, `originalDueTimestamp`, `currentDueTimestamp`, `status`, `createdAt`, `closedAt`, `reminderOffsetMinutes`, `reminderScheduledAt`, `isArchived`. Indices on `(status, currentDueTimestamp)` and `recipientName`.
- [ ] **Step 2: Implement `RenegotiationEntity`**
Fields: `id`, `commitmentId`, `previousDueTimestamp`, `revisedDueTimestamp`, `reason`, `createdAt`. Foreign key to `CommitmentEntity` with `onDelete = ForeignKey.CASCADE`. Index on `commitmentId`.

---

### Task 4: Room Type Converters & Database Configuration
**Files:**
- Create: `app/src/main/java/com/clickretina/kept/data/local/Converters.kt`
- Create: `app/src/main/java/com/clickretina/kept/data/local/KeptDatabase.kt`

- [ ] **Step 1: Implement Room TypeConverters for `CommitmentStatus` and `ReminderOffset`**
- [ ] **Step 2: Implement `KeptDatabase : RoomDatabase`**
Define database version 1, entities `CommitmentEntity` and `RenegotiationEntity`, abstract DAO accessors.

---

### Task 5: Room DAOs
**Files:**
- Create: `app/src/main/java/com/clickretina/kept/data/local/dao/CommitmentDao.kt`
- Create: `app/src/main/java/com/clickretina/kept/data/local/dao/RenegotiationDao.kt`

- [ ] **Step 1: Implement `CommitmentDao` with reactive Flow queries**
Methods: `insertCommitment`, `updateCommitment`, `deleteCommitment`, `getCommitmentById`, `observeActiveCommitments`, `observeOverdueCommitments`, `observeTodayCommitments`, `observeUpcomingCommitments`, `observeHistoryCommitments`, `getRecentRecipients`.
- [ ] **Step 2: Implement `RenegotiationDao`**
Methods: `insertRenegotiation`, `observeRenegotiationsForCommitment`, `getRenegotiationsForCommitment`.

---

### Task 6: Date & Time Utilities
**Files:**
- Create: `app/src/main/java/com/clickretina/kept/util/DateTimeUtils.kt`
- Test: `app/src/test/java/com/clickretina/kept/util/DateTimeUtilsTest.kt`

- [ ] **Step 1: Write tests for `DateTimeUtilsTest`**
Testing UTC instant conversion, day boundary calculations (startOfDay, endOfDay) across timezones, relative formatting.
- [ ] **Step 2: Implement `DateTimeUtils`**
Functions for epoch millis to formatted local string, start and end of day calculations, reminder trigger calculation.
- [ ] **Step 3: Run tests and ensure PASS**

---

### Task 7: Repository Layer
**Files:**
- Create: `app/src/main/java/com/clickretina/kept/data/repository/CommitmentRepository.kt`
- Create: `app/src/main/java/com/clickretina/kept/data/repository/CommitmentRepositoryImpl.kt`

- [ ] **Step 1: Define `CommitmentRepository` interface**
- [ ] **Step 2: Implement `CommitmentRepositoryImpl` with transactional atomic updates for renegotiation**

---

### Task 8: Automated Data Layer Tests
**Files:**
- Create: `app/src/test/java/com/clickretina/kept/data/local/CommitmentDaoTest.kt`
- Create: `app/src/test/java/com/clickretina/kept/data/repository/CommitmentRepositoryTest.kt`

- [ ] **Step 1: Implement in-memory Room DAO tests**
Verify CRUD, reactive Flow emissions, cascading foreign keys, recipient autocomplete query.
- [ ] **Step 2: Implement Repository unit tests**
- [ ] **Step 3: Run all unit tests**
Run: `./gradlew test`
Expected: 100% tests PASS

---

### Task 9: Build Verification & Manifest Privacy Audit
- [ ] **Step 1: Run `./gradlew assembleDebug`**
- [ ] **Step 2: Audit merged AndroidManifest.xml to verify no `android.permission.INTERNET`**
- [ ] **Step 3: Prepare Milestone 1 completion report**
