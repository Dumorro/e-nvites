-- Migration: Add unique constraint on qr_code + event_id
-- Description: Ensures that a QR code cannot be duplicated within the same event
-- Date: 2025-01-20

-- Add unique constraint on the combination of qr_code and event_id
-- This prevents duplicate QR codes within the same event while allowing
-- the same QR code to exist across different events
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_qr_code_event_unique
ON guests (qr_code, event_id);

-- Note: This index will also improve query performance when searching by qr_code and event_id
-- Example query that benefits: SELECT * FROM guests WHERE qr_code = 'ABC123' AND event_id = 1;
