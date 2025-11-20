# Guia: Unique Constraint para QR Code + Event ID

## Visão Geral

Este guia explica como aplicar e validar a constraint única na combinação de `qr_code` + `event_id` na tabela `guests`.

## Por que é necessário?

### Problema
Sem uma constraint única, é possível inserir múltiplos convidados com o mesmo QR code dentro do mesmo evento, causando:
- **Confusão no check-in**: Múltiplos convidados com o mesmo QR code
- **Convites duplicados**: Downloads de convites incorretos
- **Dados inconsistentes**: Dificuldade em identificar o convidado correto

### Solução
Um índice único na combinação `(qr_code, event_id)` garante que:
- ✅ Cada QR code seja único dentro do mesmo evento
- ✅ O mesmo QR code possa existir em eventos diferentes (se necessário)
- ✅ Importações CSV detectem duplicatas automaticamente
- ✅ Melhor performance nas buscas por QR code

## Como Aplicar a Migration

### Passo 1: Verificar Duplicatas Existentes

Antes de aplicar a constraint, verifique se existem duplicatas no banco:

```sql
-- Buscar duplicatas de qr_code + event_id
SELECT
  qr_code,
  event_id,
  COUNT(*) as duplicates,
  string_agg(id::text, ', ') as guest_ids
FROM guests
WHERE qr_code IS NOT NULL
GROUP BY qr_code, event_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

**Se houver duplicatas:**
- Analise os registros duplicados
- Decida qual registro manter
- Delete os registros duplicados manualmente:

```sql
-- Exemplo: Deletar duplicatas mantendo o mais antigo
DELETE FROM guests
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY qr_code, event_id
        ORDER BY created_at ASC
      ) as row_num
    FROM guests
    WHERE qr_code IS NOT NULL
  ) t
  WHERE row_num > 1
);
```

### Passo 2: Aplicar a Constraint

1. Acesse o Supabase SQL Editor
2. Execute o script [`migrations/add_unique_qr_code_event.sql`](migrations/add_unique_qr_code_event.sql):

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_qr_code_event_unique
ON guests (qr_code, event_id);
```

3. Verifique se o índice foi criado:

```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'guests'
  AND indexname = 'idx_guests_qr_code_event_unique';
```

### Passo 3: Validar a Constraint

Tente inserir uma duplicata para validar:

```sql
-- Este INSERT deve FALHAR se a constraint estiver funcionando
INSERT INTO guests (qr_code, name, event_id, guid, status)
VALUES ('TEST123', 'Teste Duplicado', 1, gen_random_uuid(), 'pending');

-- Tentar inserir novamente (deve falhar)
INSERT INTO guests (qr_code, name, event_id, guid, status)
VALUES ('TEST123', 'Teste Duplicado', 1, gen_random_uuid(), 'pending');

-- Limpar teste
DELETE FROM guests WHERE qr_code = 'TEST123';
```

**Resultado esperado:** O segundo INSERT deve falhar com erro:
```
ERROR: duplicate key value violates unique constraint "idx_guests_qr_code_event_unique"
```

## Impacto na Aplicação

### Importação CSV
Quando a API detectar QR codes duplicados, retornará erro amigável:

```json
{
  "error": "Erro ao inserir convidados",
  "details": "QR Code duplicado encontrado para este evento. Cada QR Code deve ser único dentro do mesmo evento.",
  "stats": {
    "totalRows": 10,
    "inserted": 0,
    "errors": 1
  }
}
```

### Performance
O índice único também melhora a performance das consultas:

**Antes (Sequential Scan):**
```sql
EXPLAIN ANALYZE
SELECT * FROM guests
WHERE qr_code = 'ABC123' AND event_id = 1;
-- Execution time: ~100ms (10,000 rows)
```

**Depois (Index Scan):**
```sql
EXPLAIN ANALYZE
SELECT * FROM guests
WHERE qr_code = 'ABC123' AND event_id = 1;
-- Execution time: ~0.5ms (índice único)
```

## Rollback

Se precisar remover a constraint:

```sql
DROP INDEX IF EXISTS idx_guests_qr_code_event_unique;
```

**⚠️ Atenção:** Remover a constraint permitirá duplicatas novamente!

## Casos de Uso

### ✅ Permitido
```sql
-- Mesmo QR code em eventos diferentes (OK)
INSERT INTO guests (qr_code, name, event_id, guid, status)
VALUES ('ABC123', 'João Silva', 1, gen_random_uuid(), 'pending');

INSERT INTO guests (qr_code, name, event_id, guid, status)
VALUES ('ABC123', 'João Silva', 2, gen_random_uuid(), 'pending');
```

### ❌ Bloqueado
```sql
-- Mesmo QR code no mesmo evento (ERRO)
INSERT INTO guests (qr_code, name, event_id, guid, status)
VALUES ('ABC123', 'João Silva', 1, gen_random_uuid(), 'pending');

INSERT INTO guests (qr_code, name, event_id, guid, status)
VALUES ('ABC123', 'Maria Santos', 1, gen_random_uuid(), 'pending');
-- ERROR: duplicate key value violates unique constraint
```

## Verificação de Saúde

Periodicamente, verifique a integridade dos dados:

```sql
-- Contar total de convidados
SELECT COUNT(*) as total_guests FROM guests;

-- Contar QR codes únicos por evento
SELECT
  event_id,
  COUNT(DISTINCT qr_code) as unique_qr_codes,
  COUNT(*) as total_guests
FROM guests
GROUP BY event_id;

-- Verificar se há QR codes NULL (não terão a constraint)
SELECT COUNT(*) as null_qr_codes
FROM guests
WHERE qr_code IS NULL;
```

## Perguntas Frequentes

### Por que não usar um unique constraint na coluna `qr_code` sozinha?

Porque isso impediria o uso do mesmo QR code em diferentes eventos. A constraint composta `(qr_code, event_id)` permite flexibilidade caso o mesmo código seja usado em eventos distintos.

### O que acontece com QR codes NULL?

QR codes NULL não são verificados pela constraint única (comportamento padrão do PostgreSQL). Múltiplos registros podem ter `qr_code = NULL` sem conflito.

### A constraint afeta o GUID?

Não. O GUID continua sendo único globalmente na coluna `guid` (constraint separada). A nova constraint apenas garante que QR codes sejam únicos por evento.

## Logs de Aplicação

Após aplicar a constraint, monitore os logs da API para detectar tentativas de inserção de duplicatas:

```bash
# Buscar erros de duplicatas nos logs
grep "QR Code duplicado" /var/log/app.log
```

## Manutenção

Execute este check mensalmente para garantir integridade:

```sql
-- Audit: Verificar se há alguma anomalia
SELECT
  e.name as evento,
  COUNT(DISTINCT g.qr_code) as qr_codes_unicos,
  COUNT(*) as total_convidados,
  COUNT(CASE WHEN g.qr_code IS NULL THEN 1 END) as qr_codes_nulos
FROM guests g
LEFT JOIN events e ON e.id = g.event_id
GROUP BY e.name;
```
