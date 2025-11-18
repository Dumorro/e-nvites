# Datas dos Eventos nos Emails de Confirmação

## Como Funciona

As datas informadas nos emails de confirmação vêm da coluna `event_date` da tabela `events` no Supabase.

### Fluxo de Dados

```
Banco de Dados (events.event_date)
         ↓
API (/api/rsvp/confirm-by-email)
         ↓
Email Sender (formatDate + extractTime)
         ↓
Template de Email (confirmation.tsx)
         ↓
Email enviado ao convidado
```

## Formato no Email

O email mostra:

```
📅 Data: DD/MM/YYYY
⏰ Horário: HH:MM
📍 Local: [location do evento]
```

### Exemplo Real

Se no banco está: `2024-12-02 18:30:00`

No email aparece:
```
📅 Data: 02/12/2024
⏰ Horário: 18:30
📍 Local: Marina da Glória, Rio de Janeiro
```

## Código Responsável

### 1. Formatação de Data ([lib/email/email-sender.ts](lib/email/email-sender.ts:91-106))

```typescript
private formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  // Resultado: "02/12/2024"
}
```

### 2. Extração de Horário ([lib/email/email-sender.ts](lib/email/email-sender.ts:111-125))

```typescript
private extractTime(dateString: string | null | undefined): string {
  if (!dateString) return '18:30' // Padrão

  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  // Resultado: "18:30"
}
```

### 3. Uso na API ([app/api/rsvp/confirm-by-email/route.ts](app/api/rsvp/confirm-by-email/route.ts:143-150))

```typescript
event: {
  name: fullEvent.name,
  nameEn: nameEn,
  date: fullEvent.event_date || '',      // ← Data do banco
  time: extractTime(fullEvent.event_date), // ← Horário extraído
  location: fullEvent.location || '',
  locationEn: locationEn,
}
```

### 4. Template do Email ([lib/email/templates/confirmation.tsx](lib/email/templates/confirmation.tsx:62-66))

```tsx
<Text style={paragraph}>
  <strong>📅 Data:</strong> {eventDate}
  <br />
  <strong>⏰ Horário:</strong> {eventTime}
  <br />
  <strong>📍 Local:</strong> {eventLocation}
</Text>
```

## Verificar Datas Atuais

Execute esta query no Supabase SQL Editor:

```sql
SELECT
  id,
  name,
  event_date,
  TO_CHAR(event_date, 'DD/MM/YYYY') AS data_no_email,
  TO_CHAR(event_date, 'HH24:MI') AS horario_no_email,
  location
FROM events
WHERE is_active = true
ORDER BY event_date;
```

**OU** use o arquivo: [`migrations/check_event_dates.sql`](migrations/check_event_dates.sql)

## Eventos Conhecidos

Baseado no código, os eventos configurados são:

### Evento ID 1 - Rio de Janeiro
```
Nome: Bacalhau First Oil Celebration
Nome (EN): Bacalhau First Oil Celebration
Local: Marina da Glória, Rio de Janeiro
Local (EN): Marina da Glória, Rio de Janeiro
Data: [Verificar no banco]
```

### Evento ID 2 - São Paulo
```
Nome: Bacalhau First Oil Celebration
Nome (EN): Bacalhau First Oil Celebration
Local: São Paulo
Local (EN): São Paulo
Data: [Verificar no banco]
```

### Evento ID 7 - Festa de Fim de Ano
```
Nome: Festa de Final de Ano
Nome (EN): End-of-year party
Local: Marina da Glória, Rio de Janeiro
Local (EN): Marina da Glória, Rio de Janeiro
Data: [Verificar no banco]
```

## Alterar Datas dos Eventos

### Via Supabase Dashboard

1. Acesse **Supabase Dashboard**
2. Vá para **Table Editor**
3. Selecione a tabela `events`
4. Clique na linha do evento que deseja alterar
5. Edite o campo `event_date`
6. Use o formato: `YYYY-MM-DD HH:MM:SS`
7. Salve

### Via SQL

```sql
-- Atualizar data e horário do evento
UPDATE events
SET event_date = '2024-12-15 19:00:00'
WHERE id = 7;

-- Verificar se foi atualizado
SELECT id, name, event_date
FROM events
WHERE id = 7;
```

## Formato de Data no Banco

O campo `event_date` deve estar no formato:

```
YYYY-MM-DD HH:MM:SS
```

**Exemplos válidos:**
- `2024-12-02 18:30:00` ✅
- `2024-12-15 19:00:00` ✅
- `2025-01-10 20:30:00` ✅

**Exemplos inválidos:**
- `02/12/2024` ❌ (formato brasileiro, não aceito)
- `12-02-2024 18:30` ❌ (formato MM-DD-YYYY)
- `2024/12/02 18:30` ❌ (barra em vez de hífen)

## Timezone

O sistema usa o timezone configurado no Supabase. Por padrão, é UTC.

Para exibir corretamente no Brasil (UTC-3), você pode:

1. **Armazenar já no horário de Brasília**
   - Exemplo: Se o evento é às 18:30 (horário de Brasília), armazene `18:30:00`

2. **Ou armazenar em UTC e ajustar no código**
   - Evento às 18:30 Brasília = 21:30 UTC
   - Armazene `21:30:00` UTC
   - O código converte automaticamente para timezone local

**Recomendação:** Use a opção 1 (armazenar direto no horário de Brasília) para simplicidade.

## Testes

Para testar se as datas estão corretas:

1. Acesse `/rsvp-festa` (ou outro evento)
2. Confirme com seu email de teste
3. Verifique o email recebido
4. Confira se data, horário e local estão corretos

## Valores Padrão

Se `event_date` for `NULL` ou inválido:

- **Data:** String vazia `""`
- **Horário:** `"18:30"` (padrão)

## Localização

O sistema formata datas em **português brasileiro (pt-BR)**:

```typescript
toLocaleDateString('pt-BR', { ... })  // 02/12/2024
toLocaleTimeString('pt-BR', { ... })  // 18:30
```

Não há suporte para outros idiomas na formatação de data/hora (apenas no conteúdo do email que é bilíngue).

## Arquivo de Referência

Para verificar ou alterar as datas dos eventos, use:

📄 [`migrations/check_event_dates.sql`](migrations/check_event_dates.sql) - Query SQL para consultar datas atuais
