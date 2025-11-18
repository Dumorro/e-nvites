-- =====================================================
-- ÍNDICES CRÍTICOS PARA RESOLVER TIMEOUT IMEDIATO
-- =====================================================
-- Execute este script AGORA no Supabase SQL Editor
-- Tempo estimado: 1-2 segundos
--

-- ÍNDICE MAIS CRÍTICO: event_id na tabela guests
-- Resolve o timeout no admin dashboard
CREATE INDEX IF NOT EXISTS idx_guests_event_id
ON guests(event_id);

-- Segundo mais crítico: GUID lookup (links de convite)
CREATE INDEX IF NOT EXISTS idx_guests_guid
ON guests(guid);

-- Terceiro: Status (filtros no admin)
CREATE INDEX IF NOT EXISTS idx_guests_status
ON guests(status);

-- Quarto: Ordenação por created_at
CREATE INDEX IF NOT EXISTS idx_guests_created_at
ON guests(created_at DESC);

-- Quinto: Composto event_id + status (admin com filtros múltiplos)
CREATE INDEX IF NOT EXISTS idx_guests_event_id_status
ON guests(event_id, status);

-- Atualizar estatísticas
ANALYZE guests;

-- =====================================================
-- VERIFICAR SE OS ÍNDICES FORAM CRIADOS
-- =====================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'guests'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Se aparecerem 5 índices, está correto!
