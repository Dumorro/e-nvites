-- =====================================================
-- SCRIPT DE CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Este script cria índices para otimizar as consultas mais frequentes
-- da aplicação e-nvites.
--
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Os índices são criados com IF NOT EXISTS para evitar erros em re-execuções
--

-- =====================================================
-- TABELA: guests
-- =====================================================

-- Índice para buscar convidado por GUID (usado em RSVP e confirmações)
-- Consultas: /api/rsvp, /api/rsvp/guest, /api/email/send-confirmation
CREATE INDEX IF NOT EXISTS idx_guests_guid
ON guests(guid);

-- Índice para buscar por QR code e event_id (usado em upload e busca de imagens)
-- Consultas: /api/admin/upload-invites-db, /api/rsvp/guest-image, email-sender
CREATE INDEX IF NOT EXISTS idx_guests_qr_code_event_id
ON guests(qr_code, event_id);

-- Índice para buscar por email e event_id (usado em confirmação por email)
-- Consultas: /api/rsvp/confirm-by-email
CREATE INDEX IF NOT EXISTS idx_guests_email_event_id
ON guests(email, event_id);

-- Índice para buscar por event_id (usado em listagem admin e estatísticas)
-- Consultas: /api/rsvp/list (com filtro de evento)
CREATE INDEX IF NOT EXISTS idx_guests_event_id
ON guests(event_id);

-- Índice para buscar por status (usado em listagem admin e estatísticas)
-- Consultas: /api/rsvp/list (com filtro de status)
CREATE INDEX IF NOT EXISTS idx_guests_status
ON guests(status);

-- Índice composto para filtrar por event_id e status simultaneamente
-- Consultas: /api/rsvp/list (admin dashboard com múltiplos filtros)
CREATE INDEX IF NOT EXISTS idx_guests_event_id_status
ON guests(event_id, status);

-- Índice para buscar convidados sem QR code (usado em scripts)
-- Consultas: scripts/generate-qr-codes.ts
CREATE INDEX IF NOT EXISTS idx_guests_qr_code_null
ON guests(event_id)
WHERE qr_code IS NULL;

-- Índice para ordenação por nome (usado em listagem admin)
-- Consultas: /api/rsvp/list (ordenação padrão)
CREATE INDEX IF NOT EXISTS idx_guests_name
ON guests(name);

-- Índice para ordenação por created_at (usado em listagens e relatórios)
CREATE INDEX IF NOT EXISTS idx_guests_created_at
ON guests(created_at DESC);

-- =====================================================
-- TABELA: events
-- =====================================================

-- Índice para buscar eventos ativos por ID
-- Consultas: /api/rsvp/confirm-by-email, /api/rsvp/list
CREATE INDEX IF NOT EXISTS idx_events_id_active
ON events(id, is_active);

-- Índice para buscar eventos ativos por slug
-- Consultas: Potenciais queries futuras por slug
CREATE INDEX IF NOT EXISTS idx_events_slug_active
ON events(slug, is_active);

-- Índice para buscar apenas eventos ativos
-- Consultas: /api/rsvp/list (listagem de eventos)
CREATE INDEX IF NOT EXISTS idx_events_is_active
ON events(is_active);

-- Índice para ordenação por data do evento
CREATE INDEX IF NOT EXISTS idx_events_event_date
ON events(event_date DESC NULLS LAST);

-- =====================================================
-- TABELA: email_logs
-- =====================================================

-- Índice para buscar logs por guest_id (relatórios e debugging)
CREATE INDEX IF NOT EXISTS idx_email_logs_guest_id
ON email_logs(guest_id);

-- Índice para buscar logs por status (monitoramento de falhas)
CREATE INDEX IF NOT EXISTS idx_email_logs_status
ON email_logs(status);

-- Índice para buscar logs por email do destinatário (debugging)
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email
ON email_logs(recipient_email);

-- Índice para ordenação por data de envio
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
ON email_logs(sent_at DESC);

-- Índice composto para relatórios de falhas por convidado
CREATE INDEX IF NOT EXISTS idx_email_logs_guest_status
ON email_logs(guest_id, status, sent_at DESC);

-- =====================================================
-- ÍNDICES PARA BUSCA FULL-TEXT (OPCIONAL)
-- =====================================================

-- Índice GIN para busca full-text no nome do convidado
-- Útil para pesquisas no painel admin com muitos convidados
-- NOTA: Descomente se necessário (usa mais espaço em disco)

-- CREATE INDEX IF NOT EXISTS idx_guests_name_fulltext
-- ON guests USING GIN(to_tsvector('portuguese', name));

-- Índice GIN para busca full-text no email
-- CREATE INDEX IF NOT EXISTS idx_guests_email_fulltext
-- ON guests USING GIN(to_tsvector('simple', email));

-- =====================================================
-- VACUUM E ANALYZE
-- =====================================================

-- Após criar os índices, é recomendado executar VACUUM e ANALYZE
-- para atualizar as estatísticas do PostgreSQL e otimizar o planner

VACUUM ANALYZE guests;
VACUUM ANALYZE events;
VACUUM ANALYZE email_logs;

-- =====================================================
-- VERIFICAR ÍNDICES CRIADOS
-- =====================================================

-- Execute esta query para verificar todos os índices criados:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- =====================================================
-- ESTATÍSTICAS DE TAMANHO DOS ÍNDICES
-- =====================================================

-- Execute para ver o tamanho dos índices:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================
-- MONITORAMENTO DE USO DOS ÍNDICES
-- =====================================================

-- Execute para verificar quais índices estão sendo usados:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- =====================================================
-- ÍNDICES NÃO UTILIZADOS (IDENTIFICAR PARA REMOÇÃO)
-- =====================================================

-- Execute após algumas semanas em produção para identificar
-- índices que não estão sendo utilizados:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND idx_scan = 0
--   AND indexrelid NOT IN (
--     SELECT indexrelid
--     FROM pg_index
--     WHERE indisunique OR indisprimary
--   )
-- ORDER BY pg_relation_size(indexrelid) DESC;
