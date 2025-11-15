# Migração: Adicionar Campo QR Code

Este documento explica como adicionar o campo `qr_code` à tabela `guests` no banco de dados Supabase.

## O que foi alterado

### 1. Tipos TypeScript
- Atualizado o arquivo `lib/supabase.ts` para incluir o campo `qr_code: string | null` na interface `Guest`

### 2. Estrutura do Banco de Dados
- Adicionada a coluna `qr_code` do tipo `TEXT` na tabela `guests`
- Criado índice `idx_guests_qr_code` para otimizar buscas por QR code

## Como executar a migração

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Execute o seguinte SQL:

```sql
-- Add qr_code column to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add comment to the column
COMMENT ON COLUMN guests.qr_code IS 'QR Code data for the guest invitation';

-- Create an index on qr_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_guests_qr_code ON guests(qr_code);
```

### Opção 2: Via arquivo de migração

O arquivo de migração está em: `supabase/migrations/20250115_add_qr_code_to_guests.sql`

Se você estiver usando Supabase CLI:

```bash
supabase migration up
```

## Verificar se a migração funcionou

Execute o seguinte SQL no SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests' AND column_name = 'qr_code';
```

Você deve ver:

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| qr_code     | text      | YES         |

## Uso do campo QR Code

O campo `qr_code` armazenará:
- Código único do QR Code para cada convidado
- Pode ser o mesmo valor do `guid` ou um código específico gerado
- É usado para validar o acesso do convidado no evento

### Exemplo de atualização

```typescript
const { data, error } = await supabase
  .from('guests')
  .update({ qr_code: guestGuid })
  .eq('id', guestId)
```

## Próximos Passos

1. ✅ Executar a migração no banco de dados
2. ⬜ Gerar QR codes para convidados existentes (se necessário)
3. ⬜ Implementar geração automática de QR code ao criar novo convidado
4. ⬜ Adicionar validação de QR code nas páginas de check-in
