-- =====================================================
-- SCRIPT DE MONITORAMENTO DE ÍNDICES E PERFORMANCE
-- =====================================================
-- Este script contém queries úteis para monitorar a performance
-- dos índices e identificar problemas de otimização.
--
-- Execute estas queries periodicamente no Supabase SQL Editor
-- para garantir que os índices estão funcionando corretamente.
--

-- =====================================================
-- 1. LISTAR TODOS OS ÍNDICES
-- =====================================================

SELECT
  schemaname AS schema,
  tablename AS tabela,
  indexname AS indice,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho,
  indexdef AS definicao
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 2. ÍNDICES POR TAMANHO (MAIORES PRIMEIRO)
-- =====================================================

SELECT
  schemaname AS schema,
  tablename AS tabela,
  indexname AS indice,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho,
  pg_relation_size(indexrelid) AS tamanho_bytes
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================
-- 3. USO DOS ÍNDICES (MAIS USADOS PRIMEIRO)
-- =====================================================

SELECT
  schemaname AS schema,
  tablename AS tabela,
  indexname AS indice,
  idx_scan AS vezes_usado,
  idx_tup_read AS tuplas_lidas,
  idx_tup_fetch AS tuplas_buscadas,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =====================================================
-- 4. ÍNDICES NÃO UTILIZADOS
-- =====================================================
-- IMPORTANTE: Execute apenas após algumas semanas em produção!
-- Índices novos podem aparecer aqui até serem usados pela primeira vez.

SELECT
  schemaname AS schema,
  tablename AS tabela,
  indexname AS indice,
  idx_scan AS vezes_usado,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho_desperdicado
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
    -- Excluir índices de PRIMARY KEY e UNIQUE
    SELECT indexrelid
    FROM pg_index
    WHERE indisunique OR indisprimary
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================
-- 5. ESTATÍSTICAS DAS TABELAS
-- =====================================================

SELECT
  schemaname AS schema,
  relname AS tabela,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_live_tup AS tuplas_ativas,
  n_dead_tup AS tuplas_mortas,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- =====================================================
-- 6. TABELAS QUE PRECISAM DE VACUUM
-- =====================================================

SELECT
  schemaname AS schema,
  relname AS tabela,
  n_live_tup AS tuplas_ativas,
  n_dead_tup AS tuplas_mortas,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS pct_mortas,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 0
  AND n_live_tup > 0
ORDER BY n_dead_tup DESC;

-- Se pct_mortas > 10%, considere executar VACUUM ANALYZE manualmente

-- =====================================================
-- 7. CACHE HIT RATIO (TABELAS)
-- =====================================================
-- Deve ser > 99% para boa performance

SELECT
  schemaname AS schema,
  relname AS tabela,
  heap_blks_read AS blocos_lidos_disco,
  heap_blks_hit AS blocos_lidos_cache,
  CASE
    WHEN (heap_blks_hit + heap_blks_read) > 0
    THEN ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    ELSE 0
  END AS cache_hit_ratio_pct
FROM pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY heap_blks_read DESC;

-- =====================================================
-- 8. CACHE HIT RATIO (ÍNDICES)
-- =====================================================
-- Deve ser > 99% para boa performance

SELECT
  schemaname AS schema,
  relname AS tabela,
  indexrelname AS indice,
  idx_blks_read AS blocos_lidos_disco,
  idx_blks_hit AS blocos_lidos_cache,
  CASE
    WHEN (idx_blks_hit + idx_blks_read) > 0
    THEN ROUND(100.0 * idx_blks_hit / (idx_blks_hit + idx_blks_read), 2)
    ELSE 0
  END AS cache_hit_ratio_pct
FROM pg_statio_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_blks_read DESC;

-- =====================================================
-- 9. QUERIES LENTAS (REQUER pg_stat_statements)
-- =====================================================
-- NOTA: pg_stat_statements pode não estar habilitado no Supabase Free Tier
-- Se der erro, ignore esta query

-- SELECT
--   ROUND(total_exec_time::numeric, 2) AS tempo_total_ms,
--   ROUND(mean_exec_time::numeric, 2) AS tempo_medio_ms,
--   calls AS execucoes,
--   ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_tempo_total,
--   LEFT(query, 100) AS query_resumo
-- FROM pg_stat_statements
-- WHERE query NOT LIKE '%pg_stat_statements%'
-- ORDER BY total_exec_time DESC
-- LIMIT 20;

-- =====================================================
-- 10. ANÁLISE DE BLOAT (INCHAÇO) DE ÍNDICES
-- =====================================================
-- Identifica índices que estão ocupando mais espaço do que deveriam

SELECT
  current_database() AS banco,
  schemaname AS schema,
  tablename AS tabela,
  indexname AS indice,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho_real,
  ROUND(100 * (pg_relation_size(indexrelid)::numeric /
    NULLIF(pg_table_size(tablename::regclass), 0)), 2) AS pct_tamanho_tabela
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND pg_relation_size(indexrelid) > 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Se um índice está ocupando mais de 50% do tamanho da tabela,
-- pode estar com bloat. Considere executar REINDEX.

-- =====================================================
-- 11. VERIFICAR SE ÍNDICES ESTÃO VÁLIDOS
-- =====================================================

SELECT
  n.nspname AS schema,
  c.relname AS tabela,
  i.relname AS indice,
  idx.indisvalid AS valido,
  idx.indisready AS pronto
FROM pg_index idx
JOIN pg_class c ON c.oid = idx.indrelid
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND (NOT idx.indisvalid OR NOT idx.indisready);

-- Se algum índice aparecer aqui, está com problema!

-- =====================================================
-- 12. RESUMO GERAL DE PERFORMANCE
-- =====================================================

SELECT
  'Tabela Guests' AS metrica,
  COUNT(*) AS valor
FROM guests
UNION ALL
SELECT
  'Tabela Events',
  COUNT(*)
FROM events
UNION ALL
SELECT
  'Tabela Email Logs',
  COUNT(*)
FROM email_logs
UNION ALL
SELECT
  'Total de Índices',
  COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Índices em Guests',
  COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'guests'
UNION ALL
SELECT
  'Índices em Events',
  COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'events'
UNION ALL
SELECT
  'Índices em Email Logs',
  COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'email_logs';

-- =====================================================
-- 13. COMANDOS DE MANUTENÇÃO
-- =====================================================

-- Executar VACUUM ANALYZE em todas as tabelas:
-- VACUUM ANALYZE guests;
-- VACUUM ANALYZE events;
-- VACUUM ANALYZE email_logs;

-- Recriar todos os índices de uma tabela (se necessário):
-- REINDEX TABLE guests;
-- REINDEX TABLE events;
-- REINDEX TABLE email_logs;

-- Resetar estatísticas de uso dos índices (apenas para testes):
-- SELECT pg_stat_reset();

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- =====================================================

/*

1. ÍNDICES NÃO UTILIZADOS (Query #4)
   - Se idx_scan = 0 após semanas, considere remover o índice
   - Índices não usados desperdiçam espaço e degradam INSERTs/UPDATEs

2. CACHE HIT RATIO (Queries #7 e #8)
   - > 99%: Excelente
   - 95-99%: Bom
   - < 95%: Considere aumentar shared_buffers (Supabase gerencia)

3. TUPLAS MORTAS (Query #6)
   - > 10%: Execute VACUUM ANALYZE
   - > 20%: Execute VACUUM FULL (mais lento, bloqueia tabela)

4. BLOAT DE ÍNDICES (Query #10)
   - Índice > 50% do tamanho da tabela: Pode estar com bloat
   - Solução: REINDEX TABLE nome_da_tabela

5. USO DOS ÍNDICES (Query #3)
   - Verifique se índices críticos estão sendo usados
   - idx_scan = 0: Índice nunca foi usado
   - idx_scan > 1000: Índice muito utilizado (crítico)

*/
