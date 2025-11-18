-- =====================================================
-- ATUALIZAR DATAS DE TODOS OS EVENTOS - VERSÃO FINAL
-- =====================================================
-- Este script atualiza as datas dos 3 eventos com os valores corretos
--

-- =====================================================
-- VERIFICAR DATAS ATUAIS (ANTES DA ATUALIZAÇÃO)
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
-- ATUALIZAR TODAS AS DATAS
-- =====================================================

-- Evento 1: Celebração do 1º Óleo de Bacalhau RJ 2025
-- Data: 15/12/2024 às 18:30
UPDATE events
SET
  event_date = '2024-12-15 18:30:00',
  name = 'Celebração do 1º Óleo de Bacalhau RJ 2025',
  location = 'Rio de Janeiro',
  updated_at = NOW()
WHERE id = 1;

-- Evento 2: Celebração do 1º Óleo de Bacalhau SP 2025
-- Data: 11/12/2024 às 19:00
UPDATE events
SET
  event_date = '2024-12-11 19:00:00',
  name = 'Celebração do 1º Óleo de Bacalhau SP 2025',
  location = 'São Paulo',
  updated_at = NOW()
WHERE id = 2;

-- Evento 7: Festa de Final de Ano
-- Data: 02/12/2025 às 19:30
UPDATE events
SET
  event_date = '2025-12-02 19:30:00',
  name = 'Festa de Final de Ano',
  location = 'Marina da Gloria - Rio de Janeiro',
  updated_at = NOW()
WHERE id = 7;

-- =====================================================
-- VERIFICAR DATAS APÓS ATUALIZAÇÃO
-- =====================================================

SELECT
  id,
  name,
  event_date,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada_email,
  location,
  updated_at
FROM events
WHERE id IN (1, 2, 7)
ORDER BY event_date;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
--
-- id | name                                      | data_formatada_email | location
-- ---|--------------------------------------------|----------------------|--------------------------------
--  2 | Celebração do 1º Óleo de Bacalhau SP 2025 | 11/12/2024 19:00    | São Paulo
--  1 | Celebração do 1º Óleo de Bacalhau RJ 2025 | 15/12/2024 18:30    | Rio de Janeiro
--  7 | Festa de Final de Ano                     | 02/12/2025 19:30    | Marina da Gloria - Rio de Janeiro
--

-- =====================================================
-- COMO AS DATAS APARECEM NOS EMAILS
-- =====================================================

/*

EVENTO SP (ID = 2):
━━━━━━━━━━━━━━━━━━━━
📅 Data: 11/12/2024
⏰ Horário: 19:00
📍 Local: São Paulo

EVENTO RJ (ID = 1):
━━━━━━━━━━━━━━━━━━━━
📅 Data: 15/12/2024
⏰ Horário: 18:30
📍 Local: Rio de Janeiro

EVENTO FESTA (ID = 7):
━━━━━━━━━━━━━━━━━━━━━━
📅 Data: 02/12/2025
⏰ Horário: 19:30
📍 Local: Marina da Gloria - Rio de Janeiro

*/

-- =====================================================
-- VERIFICAR QUANTIDADE DE CONVIDADOS POR EVENTO
-- =====================================================

SELECT
  e.id,
  e.name,
  TO_CHAR(e.event_date, 'DD/MM/YYYY HH24:MI') AS data_evento,
  COUNT(g.id) AS total_convidados,
  COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END) AS confirmados,
  COUNT(CASE WHEN g.status = 'pending' THEN 1 END) AS pendentes,
  COUNT(CASE WHEN g.status = 'declined' THEN 1 END) AS recusados
FROM events e
LEFT JOIN guests g ON g.event_id = e.id
WHERE e.id IN (1, 2, 7)
GROUP BY e.id, e.name, e.event_date
ORDER BY e.event_date;

-- =====================================================
-- OBSERVAÇÃO IMPORTANTE
-- =====================================================
--
-- ⚠️ ATENÇÃO: A Festa de Final de Ano está agendada para 2025!
--
-- Se isso não estiver correto e a festa for em 2024, execute:
--
-- UPDATE events
-- SET event_date = '2024-12-02 19:30:00'
-- WHERE id = 7;
--
