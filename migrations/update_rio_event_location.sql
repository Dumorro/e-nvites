-- =====================================================
-- Migration: Update Rio de Janeiro Event Location
-- =====================================================
-- Description: Update the location field for Event ID 1 (Rio)
--              to match the official venue address
-- Date: 2025-12-03
-- =====================================================

-- Update Event 1: Celebração do 1º Óleo de Bacalhau RJ
UPDATE events
SET
  location = 'MAR | Museu de Arte do Rio, Praça Mauá, 5 | Centro, Rio de Janeiro',
  updated_at = NOW()
WHERE id = 1;

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
WHERE id = 1;

-- Expected result:
-- id | name                                      | location                                                           | event_date          | data_formatada   | updated_at
-- ---|-------------------------------------------|-------------------------------------------------------------------|---------------------|------------------|-------------------
--  1 | Celebração do 1º Óleo de Bacalhau RJ 2025 | MAR | Museu de Arte do Rio, Praça Mauá, 5 | Centro, Rio de Janeiro | 2024-12-15 18:30:00 | 15/12/2024 18:30 | [timestamp atual]
