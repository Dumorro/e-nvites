-- =====================================================
-- ATUALIZAR DATAS DE TODOS OS EVENTOS
-- =====================================================
-- Script para atualizar as datas dos 3 eventos principais
--

-- =====================================================
-- 1. VERIFICAR DATAS ATUAIS
-- =====================================================

SELECT
  id,
  name,
  event_date,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada,
  location
FROM events
WHERE id IN (1, 2, 7)
ORDER BY id;

-- =====================================================
-- 2. ATUALIZAR EVENTO RIO DE JANEIRO (ID = 1)
-- =====================================================

UPDATE events
SET
  event_date = '2024-12-15 18:30:00',
  updated_at = NOW()
WHERE id = 1;

-- =====================================================
-- 3. ATUALIZAR EVENTO SÃO PAULO (ID = 2)
-- =====================================================
-- Descomente e ajuste a data se necessário

-- UPDATE events
-- SET
--   event_date = '2024-12-05 18:30:00',
--   updated_at = NOW()
-- WHERE id = 2;

-- =====================================================
-- 4. ATUALIZAR EVENTO FESTA DE FIM DE ANO (ID = 7)
-- =====================================================
-- Descomente e ajuste a data se necessário

-- UPDATE events
-- SET
--   event_date = '2024-12-20 19:00:00',
--   updated_at = NOW()
-- WHERE id = 7;

-- =====================================================
-- 5. VERIFICAR SE FORAM ATUALIZADOS
-- =====================================================

SELECT
  id,
  name,
  event_date,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada_email,
  location
FROM events
WHERE id IN (1, 2, 7)
ORDER BY id;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
--
-- id | name                              | data_formatada_email | location
-- ---|-----------------------------------|----------------------|-------------------
--  1 | Bacalhau First Oil Celebration RJ | 15/12/2024 18:30    | Marina da Glória
--  2 | Bacalhau First Oil Celebration SP | [data atual]        | São Paulo
--  7 | Festa de Final de Ano             | [data atual]        | Marina da Glória
--

-- =====================================================
-- COMO AS DATAS APARECEM NO EMAIL
-- =====================================================
--
-- Para o evento RJ (ID = 1), o email mostrará:
--
-- ✉️ Email de Confirmação:
-- ━━━━━━━━━━━━━━━━━━━━━
-- 📅 Data: 15/12/2024
-- ⏰ Horário: 18:30
-- 📍 Local: Marina da Glória, Rio de Janeiro
--
