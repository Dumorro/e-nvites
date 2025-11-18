# Teste de Email - Evento Rio de Janeiro

## 🎯 Objetivo
Enviar email de confirmação para **dumorro@gmail.com** com os dados do evento RJ:

```
📅 Data: 15/12/2024
⏰ Horário: 18:30
📍 Local: Rio de Janeiro
```

## 🚀 Método Recomendado: Via Página de Confirmação

### Passo 1: Verificar/Criar Convidado no Supabase

Acesse **Supabase → SQL Editor** e execute:

```sql
-- Verificar se o email já existe
SELECT id, name, email, status, qr_code, event_id
FROM guests
WHERE email = 'dumorro@gmail.com' AND event_id = 1;
```

**Se não existir**, crie o convidado:

```sql
INSERT INTO guests (
  guid,
  name,
  email,
  event_id,
  status,
  qr_code,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Teste Email RJ',
  'dumorro@gmail.com',
  1,
  'pending',
  'TEST-RJ-001',
  NOW(),
  NOW()
);
```

### Passo 2: Confirmar Presença e Enviar Email

#### Opção A: Via Interface Web (Mais fácil)

1. Acesse a página do evento RJ:
   - **Local:** `http://localhost:3000/rsvp-rj`
   - **Produção:** `https://seu-dominio.vercel.app/rsvp-rj`

2. Digite o email: `dumorro@gmail.com`

3. Clique em **"Confirmar Presença"**

4. O sistema irá:
   - ✅ Confirmar a presença no banco
   - ✅ Enviar email automaticamente
   - ✅ Redirecionar para página de confirmação

5. Verifique a caixa de entrada de `dumorro@gmail.com`

#### Opção B: Via API (Para teste direto)

Use curl ou Postman:

```bash
curl -X POST http://localhost:3000/api/rsvp/confirm-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dumorro@gmail.com",
    "eventId": 1
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Presença confirmada com sucesso!",
  "guestGuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Passo 3: Verificar Email Enviado

#### No Gmail (dumorro@gmail.com)

Verifique:
- ✉️ **Assunto:** "Sua presença está confirmada! - Celebração do 1º Óleo de Bacalhau RJ 2025"
- 📅 **Data no email:** 15/12/2024
- ⏰ **Horário no email:** 18:30
- 📍 **Local no email:** Rio de Janeiro

#### Nos Logs (Opcional)

Execute no Supabase:

```sql
SELECT
  recipient_email,
  recipient_name,
  subject,
  status,
  sent_at,
  error_message
FROM email_logs
WHERE recipient_email = 'dumorro@gmail.com'
ORDER BY sent_at DESC
LIMIT 1;
```

## 🔄 Método Alternativo: Reenviar Email via Admin

Se o convidado já existe e já confirmou:

### Passo 1: Acessar Admin

1. Acesse: `http://localhost:3000/admin` (ou seu domínio na produção)
2. Faça login com a senha de admin

### Passo 2: Localizar Convidado

1. No campo de busca, digite: `dumorro`
2. **OU** filtre por:
   - **Evento:** Celebração do 1º Óleo de Bacalhau RJ 2025
   - **Status:** Confirmados

### Passo 3: Reenviar Email

1. Encontre a linha com `dumorro@gmail.com`
2. Clique no botão **"📧 Reenviar Email"**
3. Confirme na mensagem popup
4. Aguarde a mensagem de sucesso

## ⚠️ Pré-requisitos

Antes de executar o teste, certifique-se de que:

### 1. Data do Evento Está Atualizada

Execute no Supabase:

```sql
SELECT id, name, TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data
FROM events WHERE id = 1;
```

**Deve retornar:** `15/12/2024 18:30`

Se não estiver correto, execute:

```sql
UPDATE events
SET event_date = '2024-12-15 18:30:00'
WHERE id = 1;
```

### 2. Variáveis de Ambiente SMTP Configuradas

Verifique no arquivo `.env.local`:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
SMTP_SENDER=seu-email@gmail.com
SMTP_FROM_NAME=Equinor Eventos
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Aplicação Rodando

```bash
# Se estiver testando localmente
yarn dev

# Ou se for na produção, já deve estar no ar
```

## 🧪 Verificação Completa

### Checklist do Email

Ao receber o email, verifique:

- [ ] **Assunto** contém "Sua presença está confirmada!"
- [ ] **Nome do evento** é "Celebração do 1º Óleo de Bacalhau RJ 2025"
- [ ] **Data** mostra "15/12/2024" (não outra data)
- [ ] **Horário** mostra "18:30"
- [ ] **Local** mostra "Rio de Janeiro"
- [ ] **Email bilíngue** (PT/EN)
- [ ] **Imagem do convite** está anexada (se existir)
- [ ] **Link para acessar convite** funciona

### Conteúdo Esperado do Email

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Presença Confirmada!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá Teste Email RJ,

Sua presença está confirmada para o evento
Celebração do 1º Óleo de Bacalhau RJ 2025.

📅 Data: 15/12/2024
⏰ Horário: 18:30
📍 Local: Rio de Janeiro

Para acessar o evento, apresente o QR Code abaixo na entrada:

[Imagem do convite / QR Code]

───────────────────────────────────────────────────────

Hello Teste Email RJ,

Your attendance is confirmed for the event
Bacalhau First Oil Celebration.

📅 Date: 15/12/2024
⏰ Time: 18:30
📍 Location: Marina da Glória, Rio de Janeiro

To access the event, present the QR Code below at the entrance:

[Link para acessar o convite]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🐛 Troubleshooting

### Email não chegou

1. **Verificar logs da aplicação** (console ou Vercel logs)
2. **Verificar spam** na caixa de entrada
3. **Verificar credenciais SMTP** no `.env.local`
4. **Verificar logs de email** no banco:

```sql
SELECT * FROM email_logs
WHERE recipient_email = 'dumorro@gmail.com'
ORDER BY sent_at DESC LIMIT 5;
```

### Data incorreta no email

1. **Verificar data no banco:**

```sql
SELECT event_date FROM events WHERE id = 1;
```

2. **Se estiver incorreta, atualizar:**

```sql
UPDATE events SET event_date = '2024-12-15 18:30:00' WHERE id = 1;
```

3. **Reenviar o email**

### Erro de autenticação SMTP

- Certifique-se de usar **senha de app** (não a senha normal do Gmail)
- Gerar em: https://myaccount.google.com/apppasswords

## 📁 Arquivo de Referência

Script SQL completo: **[migrations/test_email_rj.sql](migrations/test_email_rj.sql)**

---

**✅ Status do Teste:**

- [ ] Convidado criado/verificado no banco
- [ ] Email enviado via interface ou API
- [ ] Email recebido em dumorro@gmail.com
- [ ] Data correta: 15/12/2024 18:30
- [ ] Conteúdo bilíngue (PT/EN)
- [ ] Imagem/link do convite funciona

**Data do teste:** ___________

**Resultado:** ☐ Sucesso  ☐ Falha

**Observações:**
```
_________________________________________________________
```
