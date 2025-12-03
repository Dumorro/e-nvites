-- =====================================================
-- Migration: Update Event Locations (Rio and São Paulo)
-- =====================================================
-- Description: Update location fields for Events 1 and 2
--              to match the official venue addresses
-- Date: 2025-12-03
-- =====================================================

-- Update Event 1: Rio de Janeiro - MAR (Museu de Arte do Rio)
UPDATE events
SET
  location = 'MAR | Museu de Arte do Rio, Praça Mauá, 5 | Centro, Rio de Janeiro',
  updated_at = NOW()
WHERE id = 1;

-- Update Event 2: São Paulo - Pinacoteca
UPDATE events
SET
  location = 'Pinacoteca, Praça da Luz, 2, São Paulo',
  updated_at = NOW()
WHERE id = 2;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this query to verify both updates were successful:

SELECT
  id,
  name,
  location,
  event_date,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada,
  updated_at
FROM events
WHERE id IN (1, 2)
ORDER BY id;

-- Expected results:
-- id | name                                      | location                                                           | event_date          | data_formatada   | updated_at
-- ---|-------------------------------------------|-------------------------------------------------------------------|---------------------|------------------|-------------------
--  1 | Celebração do 1º Óleo de Bacalhau RJ 2025 | MAR | Museu de Arte do Rio, Praça Mauá, 5 | Centro, Rio de Janeiro | 2024-12-15 18:30:00 | 15/12/2024 18:30 | [timestamp atual]
--  2 | Celebração do 1º Óleo de Bacalhau SP 2025 | Pinacoteca, Praça da Luz, 2, São Paulo                            | 2024-12-11 19:00:00 | 11/12/2024 19:00 | [timestamp atual]
