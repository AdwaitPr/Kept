-- Supabase Seed Data for Kept Local Development & Testing
-- Date: 2026-11-14

-- 1. Ensure Demo User Exists in auth.users
-- Uses fixed UUID 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0' for predictable local authentication
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'authenticated',
    'authenticated',
    'demo@kept.app',
    '$2a$10$w8T0MhPkWn99R5u3QOtx5O8m9L7m41/2uXyQ8uV0k8sY/gMv16l2K',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo User"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed Realistic Commitments
-- Distribution: 1 Overdue, 2 Today, 1 Upcoming, and 1 Kept History Item with Renegotiation Audit
INSERT INTO public.commitments (
    id,
    user_id,
    recipient_name,
    title,
    notes,
    original_due_timestamp,
    current_due_timestamp,
    status,
    created_at,
    updated_at,
    closed_at,
    reminder_offset_minutes,
    reminder_scheduled_at,
    is_archived,
    is_deleted
) VALUES
-- 1. Overdue Commitment (Due yesterday)
(
    '11111111-1111-4111-8111-111111111111',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Sarah Chen',
    'Send finalized Q4 budget review',
    'Include updated runway estimates and engineering headcount breakdown.',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000)::BIGINT,
    'PENDING',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days')) * 1000)::BIGINT,
    NULL,
    15,
    ((EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000) - (15 * 60 * 1000))::BIGINT,
    FALSE,
    FALSE
),
-- 2. Today Commitment #1 (Due in 2 hours)
(
    '22222222-2222-4222-8222-222222222222',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Marcus Vance',
    'Review Kept Android PR #42',
    'Check offline Room migration and WorkManager scheduling logic.',
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '2 hours')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '2 hours')) * 1000)::BIGINT,
    'PENDING',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000)::BIGINT,
    NULL,
    30,
    ((EXTRACT(EPOCH FROM (NOW() + INTERVAL '2 hours')) * 1000) - (30 * 60 * 1000))::BIGINT,
    FALSE,
    FALSE
),
-- 3. Today Commitment #2 (Due in 5 hours)
(
    '33333333-3333-4333-8333-333333333333',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Elena Rostova',
    'Sign partnership agreement draft',
    'Review clauses 4.1 and 7.3 regarding intellectual property.',
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '5 hours')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '5 hours')) * 1000)::BIGINT,
    'PENDING',
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    NULL,
    0,
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '5 hours')) * 1000)::BIGINT,
    FALSE,
    FALSE
),
-- 4. Upcoming Commitment (Due in 3 days)
(
    '44444444-4444-4444-8444-444444444444',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'David K.',
    'Deliver keynote slide deck for Tech Summit',
    'Include customer case studies and benchmark graphs.',
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '3 days')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() + INTERVAL '3 days')) * 1000)::BIGINT,
    'PENDING',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days')) * 1000)::BIGINT,
    NULL,
    60,
    ((EXTRACT(EPOCH FROM (NOW() + INTERVAL '3 days')) * 1000) - (60 * 60 * 1000))::BIGINT,
    FALSE,
    FALSE
),
-- 5. History Commitment (Closed as KEPT, with prior renegotiation)
(
    '55555555-5555-4555-8555-555555555555',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    'Amara Patel',
    'Deploy v1.2 beta release candidate',
    'Pushed to internal dogfood channel after resolving proguard issue.',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days')) * 1000)::BIGINT,
    'KEPT',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '6 days')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 day')) * 1000)::BIGINT,
    15,
    ((EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days')) * 1000) - (15 * 60 * 1000))::BIGINT,
    FALSE,
    FALSE
)
ON CONFLICT (id) DO UPDATE SET
    recipient_name = EXCLUDED.recipient_name,
    title = EXCLUDED.title,
    notes = EXCLUDED.notes,
    original_due_timestamp = EXCLUDED.original_due_timestamp,
    current_due_timestamp = EXCLUDED.current_due_timestamp,
    status = EXCLUDED.status,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at,
    closed_at = EXCLUDED.closed_at,
    reminder_offset_minutes = EXCLUDED.reminder_offset_minutes,
    reminder_scheduled_at = EXCLUDED.reminder_scheduled_at,
    is_archived = EXCLUDED.is_archived,
    is_deleted = EXCLUDED.is_deleted;

-- 3. Seed Renegotiation Audit History
-- Historical audit trail for Commitment #5 ('55555555-5555-4555-8555-555555555555')
INSERT INTO public.renegotiations (
    id,
    commitment_id,
    user_id,
    previous_due_timestamp,
    revised_due_timestamp,
    reason,
    created_at
) VALUES (
    '66666666-6666-4666-8666-666666666666',
    '55555555-5555-4555-8555-555555555555',
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days')) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 days')) * 1000)::BIGINT,
    'Needed extra time to resolve Android ProGuard build minimization issue with Room entities.',
    (EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 days')) * 1000)::BIGINT
)
ON CONFLICT (id) DO UPDATE SET
    previous_due_timestamp = EXCLUDED.previous_due_timestamp,
    revised_due_timestamp = EXCLUDED.revised_due_timestamp,
    reason = EXCLUDED.reason,
    created_at = EXCLUDED.created_at;
