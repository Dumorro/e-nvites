-- =====================================================
-- ATUALIZAR DATA DO EVENTO OIL CELEBRATION RJ
-- =====================================================
-- Atualiza a data do evento Rio de Janeiro para 15/12/2024 às 18:30
--

-- Verificar data atual
SELECT
  id,
  name,
  event_date AS data_atual,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada
FROM events
WHERE id = 1;

-- Atualizar para a nova data
UPDATE events
SET
  event_date = '2024-12-15 18:30:00',
  updated_at = NOW()
WHERE id = 1;

-- Verificar se foi atualizado corretamente
SELECT
  id,
  name,
  event_date AS nova_data,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada
FROM events
WHERE id = 1;

-- Resultado esperado:
-- id | name                              | nova_data           | data_formatada
-- ---|-----------------------------------|---------------------|------------------
--  1 | Bacalhau First Oil Celebration RJ | 2024-12-15 18:30:00 | 15/12/2024 18:30

-- =====================================================
-- IMPORTANTE
-- =====================================================
-- Após executar este script, os emails de confirmação
-- enviados para o evento RJ mostrarão:
--
-- 📅 Data: 15/12/2024
-- ⏰ Horário: 18:30
-- 📍 Local: Marina da Glória, Rio de Janeiro
--
