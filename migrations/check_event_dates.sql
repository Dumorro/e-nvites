-- =====================================================
-- VERIFICAR DATAS DOS EVENTOS
-- =====================================================
-- Execute esta query no Supabase SQL Editor para ver
-- as datas que estão sendo enviadas nos emails
--

SELECT
  id,
  name,
  event_date,
  -- Formato da data que aparece no email (dia/mês/ano)
  TO_CHAR(event_date, 'DD/MM/YYYY') AS data_formatada_email,
  -- Horário que aparece no email
  TO_CHAR(event_date, 'HH24:MI') AS horario_email,
  location,
  is_active
FROM events
WHERE is_active = true
ORDER BY event_date;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
--
-- Você verá algo como:
--
-- id | name                              | event_date          | data_formatada_email | horario_email | location
-- ---|-----------------------------------|---------------------|----------------------|---------------|-------------------
--  1 | Bacalhau First Oil Celebration RJ | 2024-12-02 18:30:00 | 02/12/2024          | 18:30         | Marina da Glória
--  2 | Bacalhau First Oil Celebration SP | 2024-12-05 18:30:00 | 05/12/2024          | 18:30         | São Paulo
--  7 | Festa de Final de Ano             | 2024-12-XX XX:XX:00 | XX/12/2024          | XX:XX         | Marina da Glória
--

-- =====================================================
-- COMO AS DATAS SÃO USADAS NO EMAIL
-- =====================================================
--
-- O email usa duas funções:
--
-- 1. formatDate() - Formata a data no padrão brasileiro (DD/MM/YYYY)
--    Exemplo: "02/12/2024"
--
-- 2. extractTime() - Extrai o horário (HH:MM)
--    Exemplo: "18:30"
--    Padrão se não houver data: "18:30"
--
-- No template do email, aparece assim:
--
-- 📅 Data: 02/12/2024
-- ⏰ Horário: 18:30
-- 📍 Local: Marina da Glória, Rio de Janeiro
--

-- =====================================================
-- ALTERAR DATAS DOS EVENTOS (SE NECESSÁRIO)
-- =====================================================
--
-- Para atualizar a data de um evento:
--
-- UPDATE events
-- SET event_date = '2024-12-15 19:00:00'
-- WHERE id = 7;
--
-- IMPORTANTE: Use o formato 'YYYY-MM-DD HH:MI:SS'
--
