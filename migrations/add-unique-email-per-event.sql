-- Migration: Add unique constraint for email per event
-- Execute this SQL in your Supabase SQL Editor
-- Created: 2025-11-25

-- ==============================================================
-- Add unique index to prevent duplicate emails within same event
-- ==============================================================

-- This index ensures that:
-- 1. Same email cannot be used twice in the same event (event_id)
-- 2. Same email CAN be used across different events
-- 3. NULL emails are allowed (WHERE clause excludes them)
-- 4. Multiple guests with NULL email are allowed in same event

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_unique_email_per_event
  ON guests(email, event_id)
  WHERE email IS NOT NULL;

-- ==============================================================
-- Verification queries
-- ==============================================================

-- Check for existing duplicate emails in same event
-- Run this BEFORE creating the index to identify conflicts
SELECT
  event_id,
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(name, ', ') as guest_names
FROM guests
WHERE email IS NOT NULL
GROUP BY event_id, email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- If duplicates exist, you'll need to resolve them first
-- Example: Update duplicate emails to make them unique
-- UPDATE guests SET email = 'unique_email@example.com' WHERE id = XXX;
