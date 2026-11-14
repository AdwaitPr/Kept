-- Supabase Database Migration: Initial Schema for Kept
-- Date: 2026-11-14

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Commitment Status Enum
CREATE TYPE commitment_status AS ENUM ('PENDING', 'RENEGOTIATED', 'KEPT', 'RELEASED');

-- 1. Commitments Table
CREATE TABLE public.commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    original_due_timestamp BIGINT NOT NULL, -- UTC Epoch Milliseconds
    current_due_timestamp BIGINT NOT NULL,  -- UTC Epoch Milliseconds
    status commitment_status NOT NULL DEFAULT 'PENDING',
    created_at BIGINT NOT NULL,             -- UTC Epoch Milliseconds
    updated_at BIGINT NOT NULL,             -- UTC Epoch Milliseconds (For LWW conflict resolution)
    closed_at BIGINT,                       -- UTC Epoch Milliseconds
    reminder_offset_minutes INT DEFAULT 0,
    reminder_scheduled_at BIGINT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE -- Soft delete for multi-device sync
);

-- Indices for rapid querying
CREATE INDEX idx_commitments_user_status_due ON public.commitments(user_id, status, current_due_timestamp);
CREATE INDEX idx_commitments_user_recipient ON public.commitments(user_id, recipient_name);
CREATE INDEX idx_commitments_user_updated_at ON public.commitments(user_id, updated_at);

-- 2. Renegotiation Audit History Table
CREATE TABLE public.renegotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_id UUID NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_due_timestamp BIGINT NOT NULL,
    revised_due_timestamp BIGINT NOT NULL,
    reason TEXT,
    created_at BIGINT NOT NULL
);

CREATE INDEX idx_renegotiations_commitment_id ON public.renegotiations(commitment_id);

-- 3. Row-Level Security (RLS) Policies
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renegotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own commitments"
    ON public.commitments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own commitments"
    ON public.commitments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own commitments"
    ON public.commitments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own commitments"
    ON public.commitments FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for Renegotiations
CREATE POLICY "Users manage their own renegotiation records"
    ON public.renegotiations FOR ALL
    USING (auth.uid() = user_id);

-- Enable Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.commitments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.renegotiations;
