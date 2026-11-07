# AGENTS.md — Kept Android Development Guidelines

## Project Identity & Directives
- **Project Name**: Kept (`com.clickretina.kept`)
- **Type**: Native Android Application (Kotlin, Jetpack Compose, Material 3, Room, MVVM, Offline-First).
- **Core Purpose**: Lightweight interpersonal commitment ledger. Tracks promises made to other people with explicit closure: `Kept`, `Renegotiated`, or `Released`.
- **Primary Rule**: Never turn Kept into a generic task manager, CRM, or social messaging app.

## Critical Engineering Principles
1. **Offline-First & Privacy**:
   - Zero cloud requirements, no accounts/auth, no internet permission (`android.permission.INTERNET` must NOT be present in merged manifest).
   - Zero contact scraping (`READ_CONTACTS` is strictly forbidden). Recipient autocomplete is populated solely from Kept's own local commitment history.
2. **Time & Timezones**:
   - Store all timestamps in UTC epoch milliseconds.
   - Display in user's current local timezone via `java.time.Instant` and `ZoneId.systemDefault()`.
   - Time calculations must use testable clock abstractions.
3. **Reminders & Scheduling**:
   - Individual commitment reminders: `AlarmManager.setExactAndAllowWhileIdle()` when permitted, with graceful fallback to inexact window alarm if `SCHEDULE_EXACT_ALARM` is denied.
   - End-of-Day Review: Handled via `WorkManager` (periodic, flexible window around 8:30 PM).
   - Reboots & app updates: Restored via `BootReceiver` and `PackageReplacedReceiver`.
4. **Milestone Governance**:
   - Implement one milestone at a time.
   - Always run automated tests (`./gradlew test`) and verify builds (`./gradlew assembleDebug`).
   - Maintain `README.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_STATUS.md`.
   - Never proceed to the next milestone without explicit user approval.
