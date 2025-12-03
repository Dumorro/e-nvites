-- =====================================================
-- Migration: Update São Paulo Event Location
-- =====================================================
-- Description: Update the location field for Event ID 2 (São Paulo)
--              to match the official venue address
-- Date: 2025-12-03
-- =====================================================

-- Update Event 2: Celebração do 1º Óleo de Bacalhau SP
UPDATE events
SET
  location = 'Pinacoteca, Praça da Luz, 2, São Paulo',
  updated_at = NOW()
WHERE id = 2;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this query to verify the update was successful:

SELECT
  id,
  name,
  location,
  event_date,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada,
  updated_at
FROM events
WHERE id = 2;

-- Expected result:
-- id | name                                      | location                                | event_date          | data_formatada   | updated_at
-- ---|-------------------------------------------|----------------------------------------|---------------------|------------------|-------------------
--  2 | Celebração do 1º Óleo de Bacalhau SP 2025 | Pinacoteca, Praça da Luz, 2, São Paulo | 2024-12-11 19:00:00 | 11/12/2024 19:00 | [timestamp atual]
