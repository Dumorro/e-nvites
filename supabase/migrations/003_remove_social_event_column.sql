-- ==============================================================
-- MIGRATION 003: Remover coluna social_event da tabela guests
-- Execute este SQL após vincular todos os convidados aos eventos
-- ==============================================================

-- Verificar se há convidados sem event_id antes de remover
DO $$
DECLARE
  guests_without_event INT;
BEGIN
  SELECT COUNT(*) INTO guests_without_event
  FROM guests
  WHERE event_id IS NULL;

  IF guests_without_event > 0 THEN
    RAISE NOTICE '⚠️  Atenção: % convidado(s) ainda sem event_id!', guests_without_event;
    RAISE NOTICE 'Execute o UPDATE abaixo antes de remover a coluna social_event:';
    RAISE NOTICE 'UPDATE guests SET event_id = events.id FROM events WHERE guests.social_event = events.name;';
  ELSE
    RAISE NOTICE '✅ Todos os convidados estão vinculados a eventos.';
  END IF;
END $$;

-- Remover o índice da coluna social_event
DROP INDEX IF EXISTS idx_guests_social_event;

-- Remover a coluna social_event (comentada por segurança)
-- Descomente a linha abaixo quando tiver certeza
-- ALTER TABLE guests DROP COLUMN IF EXISTS social_event;

-- ==============================================================
-- Verificação final
-- ==============================================================

-- Ver convidados com seus eventos
SELECT
  g.id,
  g.name as convidado,
  g.event_id,
  e.name as evento,
  e.location
FROM guests g
LEFT JOIN events e ON g.event_id = e.id
ORDER BY e.name, g.name
LIMIT 20;

-- Estatísticas
SELECT
  'Total de convidados' as metrica,
  COUNT(*) as valor
FROM guests
UNION ALL
SELECT
  'Convidados com evento',
  COUNT(*)
FROM guests
WHERE event_id IS NOT NULL
UNION ALL
SELECT
  'Convidados sem evento',
  COUNT(*)
FROM guests
WHERE event_id IS NULL;
