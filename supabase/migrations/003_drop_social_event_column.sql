-- ==============================================================
-- MIGRATION 003: Remover coluna social_event definitivamente
-- Execute este SQL no Supabase SQL Editor
-- ==============================================================

-- 1. Verificar convidados sem event_id
SELECT
  COUNT(*) as total_sem_evento,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Pronto para remover social_event'
    ELSE '⚠️  Vincule os convidados aos eventos primeiro!'
  END as status
FROM guests
WHERE event_id IS NULL;

-- 2. Se houver convidados sem event_id, vincule-os primeiro
UPDATE guests
SET event_id = events.id
FROM events
WHERE guests.social_event = events.name
  AND guests.event_id IS NULL
  AND guests.social_event IS NOT NULL;

-- 3. Remover índice da coluna social_event
DROP INDEX IF EXISTS idx_guests_social_event;

-- 4. Remover a coluna social_event
ALTER TABLE guests DROP COLUMN IF EXISTS social_event;

-- ==============================================================
-- Verificação final
-- ==============================================================

-- Listar colunas da tabela guests (confirmar que social_event foi removida)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests'
ORDER BY ordinal_position;

-- Verificar dados dos convidados
SELECT
  g.id,
  g.name,
  g.event_id,
  e.name as evento_nome,
  e.location,
  g.status
FROM guests g
LEFT JOIN events e ON g.event_id = e.id
ORDER BY e.name, g.name
LIMIT 10;

-- Estatísticas finais
SELECT
  'Total de convidados' as metrica,
  COUNT(*)::text as valor
FROM guests
UNION ALL
SELECT
  'Convidados com evento vinculado',
  COUNT(*)::text
FROM guests
WHERE event_id IS NOT NULL
UNION ALL
SELECT
  'Convidados SEM evento',
  COUNT(*)::text
FROM guests
WHERE event_id IS NULL;
