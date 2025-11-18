# Guia de Índices do Banco de Dados

## Visão Geral

Este documento explica todos os índices criados para otimizar a performance da aplicação e-nvites. Os índices foram projetados baseados nas consultas mais frequentes identificadas no código.

## Como Aplicar

Execute o script SQL localizado em `migrations/create_indexes.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Copie e cole o conteúdo de `migrations/create_indexes.sql`
4. Execute o script

**Tempo estimado:** 1-5 segundos (dependendo do volume de dados)

## Índices da Tabela `guests`

### 1. idx_guests_guid

```sql
CREATE INDEX idx_guests_guid ON guests(guid);
```

**Objetivo:** Otimizar busca de convidados por GUID (UUID).

**Usado em:**
- `/api/rsvp` - Buscar convidado ao acessar link de confirmação
- `/api/rsvp/guest` - Validar GUID e retornar dados do convidado
- `/api/email/send-confirmation` - Enviar email de confirmação

**Impacto:** Alto - Esta é a query mais frequente (cada acesso ao link de convite)

**Tipo de scan antes:** Sequential Scan (O(n))
**Tipo de scan depois:** Index Scan (O(log n))

---

### 2. idx_guests_qr_code_event_id

```sql
CREATE INDEX idx_guests_qr_code_event_id ON guests(qr_code, event_id);
```

**Objetivo:** Otimizar busca de convidados por QR code dentro de um evento específico.

**Usado em:**
- `/api/admin/upload-invites-db` - Associar imagem ao convidado correto
- `/api/rsvp/guest-image` - Buscar imagem do convite
- `lib/email/email-sender.ts` - Buscar imagem para anexar ao email

**Impacto:** Alto - Usado em uploads e envio de emails

**Nota:** Índice composto (qr_code, event_id) é mais eficiente que dois índices separados para esta query específica.

---

### 3. idx_guests_email_event_id

```sql
CREATE INDEX idx_guests_email_event_id ON guests(email, event_id);
```

**Objetivo:** Otimizar busca de convidados por email dentro de um evento.

**Usado em:**
- `/api/rsvp/confirm-by-email` - Confirmação via email em páginas específicas de evento

**Impacto:** Médio - Usado em páginas de RSVP específicas (rsvp-rj, rsvp-sp, rsvp-festa)

**Observação:** Emails podem conter NULL, índice ainda é útil.

---

### 4. idx_guests_event_id

```sql
CREATE INDEX idx_guests_event_id ON guests(event_id);
```

**Objetivo:** Otimizar listagem e filtros por evento.

**Usado em:**
- `/api/rsvp/list` - Admin dashboard com filtro de evento
- Estatísticas por evento
- Scripts de geração de QR codes

**Impacto:** Alto - Usado no painel admin

---

### 5. idx_guests_status

```sql
CREATE INDEX idx_guests_status ON guests(status);
```

**Objetivo:** Otimizar filtros e estatísticas por status de confirmação.

**Usado em:**
- `/api/rsvp/list` - Admin dashboard com filtro de status
- Estatísticas de confirmados/pendentes/declinados

**Impacto:** Alto - Usado para estatísticas em tempo real

---

### 6. idx_guests_event_id_status

```sql
CREATE INDEX idx_guests_event_id_status ON guests(event_id, status);
```

**Objetivo:** Otimizar queries que filtram por evento E status simultaneamente.

**Usado em:**
- `/api/rsvp/list` - Admin dashboard com múltiplos filtros ativos
- Relatórios de confirmação por evento

**Impacto:** Médio-Alto - Usado quando admin filtra "Evento RJ + Confirmados"

**Nota:** PostgreSQL pode usar este índice mesmo com apenas `event_id` na query (leftmost prefix).

---

### 7. idx_guests_qr_code_null

```sql
CREATE INDEX idx_guests_qr_code_null ON guests(event_id) WHERE qr_code IS NULL;
```

**Objetivo:** Otimizar busca de convidados sem QR code (partial index).

**Usado em:**
- `scripts/generate-qr-codes.ts` - Gerar QR codes para novos convidados

**Impacto:** Baixo - Usado apenas em scripts de manutenção

**Vantagem:** Índice parcial usa muito menos espaço (apenas registros com qr_code NULL)

---

### 8. idx_guests_name

```sql
CREATE INDEX idx_guests_name ON guests(name);
```

**Objetivo:** Otimizar ordenação e busca por nome.

**Usado em:**
- `/api/rsvp/list` - Ordenação padrão no admin dashboard
- Busca de convidados por nome (search)

**Impacto:** Médio - Usado em listagens

**Observação:** Pode ser expandido para full-text search se necessário.

---

### 9. idx_guests_created_at

```sql
CREATE INDEX idx_guests_created_at ON guests(created_at DESC);
```

**Objetivo:** Otimizar ordenação por data de criação.

**Usado em:**
- Relatórios cronológicos
- Listagens de convidados recém-adicionados

**Impacto:** Baixo - Usado em relatórios

---

## Índices da Tabela `events`

### 10. idx_events_id_active

```sql
CREATE INDEX idx_events_id_active ON events(id, is_active);
```

**Objetivo:** Otimizar busca de eventos ativos por ID.

**Usado em:**
- `/api/rsvp/confirm-by-email` - Validar evento ativo antes de confirmar
- Joins com guests para filtrar apenas eventos ativos

**Impacto:** Médio

---

### 11. idx_events_slug_active

```sql
CREATE INDEX idx_events_slug_active ON events(slug, is_active);
```

**Objetivo:** Otimizar busca de eventos ativos por slug.

**Usado em:**
- Queries futuras que podem usar slug
- Rotas específicas de eventos

**Impacto:** Baixo - Preparação para futuro

---

### 12. idx_events_is_active

```sql
CREATE INDEX idx_events_is_active ON events(is_active);
```

**Objetivo:** Otimizar listagem de eventos ativos.

**Usado em:**
- `/api/rsvp/list` - Dropdown de eventos no admin

**Impacto:** Baixo - Poucos eventos no sistema

---

### 13. idx_events_event_date

```sql
CREATE INDEX idx_events_event_date ON events(event_date DESC NULLS LAST);
```

**Objetivo:** Otimizar ordenação por data do evento.

**Usado em:**
- Listagem de eventos ordenados cronologicamente

**Impacto:** Baixo

---

## Índices da Tabela `email_logs`

### 14. idx_email_logs_guest_id

```sql
CREATE INDEX idx_email_logs_guest_id ON email_logs(guest_id);
```

**Objetivo:** Otimizar busca de logs por convidado.

**Usado em:**
- Relatórios de emails enviados por convidado
- Debugging de emails não recebidos

**Impacto:** Baixo - Usado em debugging

---

### 15. idx_email_logs_status

```sql
CREATE INDEX idx_email_logs_status ON email_logs(status);
```

**Objetivo:** Otimizar busca de emails falhados.

**Usado em:**
- Monitoramento de falhas de envio
- Relatórios de emails pendentes/enviados/falhados

**Impacto:** Médio - Importante para monitoramento

---

### 16. idx_email_logs_recipient_email

```sql
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);
```

**Objetivo:** Otimizar busca de logs por email do destinatário.

**Usado em:**
- Debugging ("Por que fulano@email.com não recebeu?")

**Impacto:** Baixo

---

### 17. idx_email_logs_sent_at

```sql
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

**Objetivo:** Otimizar ordenação por data de envio.

**Usado em:**
- Relatórios cronológicos de emails

**Impacto:** Baixo

---

### 18. idx_email_logs_guest_status

```sql
CREATE INDEX idx_email_logs_guest_status ON email_logs(guest_id, status, sent_at DESC);
```

**Objetivo:** Otimizar relatórios de falhas por convidado.

**Usado em:**
- Análise de convidados que não receberam email
- Relatórios de re-tentativas

**Impacto:** Baixo

---

## Índices Full-Text (Opcional)

### idx_guests_name_fulltext (Comentado)

```sql
CREATE INDEX idx_guests_name_fulltext ON guests USING GIN(to_tsvector('portuguese', name));
```

**Objetivo:** Permitir busca full-text em nomes com stemming em português.

**Quando usar:** Se o admin dashboard tiver uma feature de busca avançada de convidados.

**Impacto no espaço:** Médio-Alto (índices GIN são maiores)

**Como ativar:** Descomente a linha no script SQL.

---

## Monitoramento de Performance

**Script Completo:** Para facilitar o monitoramento, use o script [`migrations/monitor_indexes.sql`](migrations/monitor_indexes.sql) que contém todas as queries abaixo e mais.

### Verificar índices criados

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verificar tamanho dos índices

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Verificar uso dos índices

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Identificar índices não utilizados

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
    SELECT indexrelid
    FROM pg_index
    WHERE indisunique OR indisprimary
  )
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Recomendação:** Execute esta query após algumas semanas em produção para identificar índices que não estão sendo usados e considere removê-los.

---

## Estimativa de Ganho de Performance

| Query | Antes (sem índices) | Depois (com índices) | Ganho |
|-------|-------------------|---------------------|-------|
| Busca por GUID | O(n) Sequential Scan | O(log n) Index Scan | 100-1000x |
| Busca por email + event_id | O(n) Sequential Scan | O(log n) Index Scan | 100-1000x |
| Busca por qr_code + event_id | O(n) Sequential Scan | O(log n) Index Scan | 100-1000x |
| Listagem admin (filtros) | O(n) Sequential Scan | O(log n) Index Scan | 50-500x |
| Ordenação por nome | O(n log n) Sort | O(n) Index Scan | 10-100x |

**Nota:** Ganhos reais dependem do volume de dados. Com 100 convidados, ganhos são pequenos. Com 10.000+, ganhos são significativos.

---

## Espaço em Disco

Cada índice usa espaço adicional no disco. Estimativa:

- **Índices simples (int, uuid):** ~5-10% do tamanho da tabela
- **Índices compostos:** ~10-15% do tamanho da tabela
- **Índices GIN (full-text):** ~30-50% do tamanho da tabela

**Exemplo:**
- Tabela guests com 10.000 registros: ~50 MB
- Total de índices: ~10-15 MB
- Índices GIN (se ativados): +15-25 MB

**Conclusão:** Para o volume esperado desta aplicação (<100.000 convidados), o impacto no espaço é mínimo.

---

## Manutenção

### VACUUM ANALYZE

O script já inclui VACUUM ANALYZE ao final. Execute periodicamente:

```sql
VACUUM ANALYZE guests;
VACUUM ANALYZE events;
VACUUM ANALYZE email_logs;
```

**Quando executar:**
- Após inserir grande volume de dados (importação em massa)
- Após excluir muitos registros
- Semanalmente em produção (automático no Supabase)

### REINDEX

Se índices ficarem corrompidos ou fragmentados:

```sql
REINDEX TABLE guests;
REINDEX TABLE events;
REINDEX TABLE email_logs;
```

**Quando executar:**
- Após migração de dados
- Se queries ficarem lentas mesmo com índices

---

## Troubleshooting

### Query ainda está lenta

1. Verifique se o índice está sendo usado:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM guests WHERE guid = 'xxx';
   ```

2. Procure por "Seq Scan" no output. Se encontrar, o índice não está sendo usado.

3. Execute VACUUM ANALYZE:
   ```sql
   VACUUM ANALYZE guests;
   ```

4. Verifique se há suficiente shared_buffers (Supabase gerencia automaticamente)

### Índice não está sendo usado

Possíveis causas:
- Estatísticas desatualizadas (execute VACUUM ANALYZE)
- Tabela muito pequena (PostgreSQL decide que Seq Scan é mais rápido)
- Query não está usando a coluna indexada corretamente
- Função na coluna (ex: LOWER(name)) invalida índice simples

### Índice causando slow writes

Se INSERTs/UPDATEs ficarem lentos:
- Considere remover índices raramente usados
- Use partial indexes onde possível
- Monitore com query de "índices não utilizados"

---

## Conclusão

Com estes índices, a aplicação e-nvites terá performance otimizada para:
- Acessos aos links de confirmação (busca por GUID)
- Upload de imagens (busca por QR code)
- Painel admin (filtros e ordenação)
- Envio de emails (busca de imagens e dados)
- Relatórios e estatísticas

**Próximo passo:** Execute o script `migrations/create_indexes.sql` no Supabase!
