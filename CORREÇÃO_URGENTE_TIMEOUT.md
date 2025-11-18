# Correção Urgente: Timeout no Admin Dashboard

## Problema
```
canceling statement due to statement timeout
```

O painel admin está excedendo o tempo limite do Supabase porque falta índice na coluna `event_id` da tabela `guests`.

## Solução Imediata (1 minuto)

### Passo 1: Criar Índices Críticos

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole o script abaixo e execute:

```sql
-- Índices críticos para resolver timeout
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_guid ON guests(guid);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_created_at ON guests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guests_event_id_status ON guests(event_id, status);

-- Atualizar estatísticas
ANALYZE guests;
```

**OU** use o arquivo: [`migrations/create_critical_indexes.sql`](migrations/create_critical_indexes.sql)

### Passo 2: Testar

1. Acesse `/admin` novamente
2. O dashboard deve carregar em < 2 segundos
3. Teste os filtros (status, evento)

## Mudanças no Código (Já Aplicadas)

### 1. API otimizada ([app/api/rsvp/list/route.ts](app/api/rsvp/list/route.ts))
- ✅ Select específico de colunas (em vez de `*`)
- ✅ Limite de 1000 registros por query
- ✅ Select otimizado no join: `event:events(id, name, location, event_date)`

### 2. Mensagens de erro melhoradas
- ✅ Agora você vê detalhes específicos do erro

## Próximos Passos (Opcional)

Após resolver o problema imediato, aplique todos os índices de performance:

```sql
-- Execute o script completo de índices
-- Arquivo: migrations/create_indexes.sql
```

Veja [`CHECKLIST_PERFORMANCE.md`](CHECKLIST_PERFORMANCE.md) para guia completo.

## Por Que Isso Aconteceu?

1. **Sem índice em `event_id`**: O PostgreSQL fez Sequential Scan em toda a tabela
2. **Join com events**: Agravou o problema multiplicando o tempo
3. **Timeout do Supabase**: Free tier tem limite de tempo de query

## Ganho Esperado

| Antes | Depois |
|-------|--------|
| Timeout (30+ segundos) | < 2 segundos |

## Verificar Sucesso

Execute no Supabase SQL Editor:

```sql
-- Verificar índices criados
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'guests'
  AND indexname LIKE 'idx_%';
```

**Resultado esperado:** Deve listar os 5 índices criados.

## Rollback (Se Necessário)

```sql
-- Remover índices (NÃO RECOMENDADO)
DROP INDEX IF EXISTS idx_guests_event_id;
DROP INDEX IF EXISTS idx_guests_guid;
DROP INDEX IF EXISTS idx_guests_status;
DROP INDEX IF EXISTS idx_guests_created_at;
DROP INDEX IF EXISTS idx_guests_event_id_status;
```

---

**⚠️ AÇÃO NECESSÁRIA:** Execute o script SQL acima no Supabase AGORA para resolver o timeout!
