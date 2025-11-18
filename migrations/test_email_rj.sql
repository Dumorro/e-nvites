-- =====================================================
-- TESTE DE EMAIL - EVENTO RIO DE JANEIRO
-- =====================================================
-- Email de teste: dumorro@gmail.com
--

-- =====================================================
-- 1. VERIFICAR SE O EMAIL JÁ EXISTE NO EVENTO RJ
-- =====================================================

SELECT
  id,
  name,
  email,
  status,
  qr_code,
  event_id
FROM guests
WHERE email = 'dumorro@gmail.com'
  AND event_id = 1;

-- =====================================================
-- 2. SE NÃO EXISTIR, CRIAR CONVIDADO DE TESTE
-- =====================================================

-- Descomente as linhas abaixo se o email não existir:

-- INSERT INTO guests (
--   guid,
--   name,
--   email,
--   event_id,
--   status,
--   qr_code,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'Teste Email RJ',
--   'dumorro@gmail.com',
--   1,
--   'pending',
--   'TEST-RJ-001',
--   NOW(),
--   NOW()
-- );

-- =====================================================
-- 3. VERIFICAR DADOS DO EVENTO RJ
-- =====================================================

SELECT
  id,
  name,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_formatada,
  location,
  is_active
FROM events
WHERE id = 1;

-- Resultado esperado:
-- id | name                                      | data_formatada    | location          | is_active
-- ---|-------------------------------------------|-------------------|-------------------|----------
--  1 | Celebração do 1º Óleo de Bacalhau RJ 2025 | 15/12/2024 18:30 | Rio de Janeiro    | true

-- =====================================================
-- 4. OBTER GUID PARA TESTE
-- =====================================================

SELECT
  guid,
  name,
  email,
  qr_code
FROM guests
WHERE email = 'dumorro@gmail.com'
  AND event_id = 1;

-- Copie o GUID que aparecer aqui
-- Você usará este GUID para acessar a página de confirmação

-- =====================================================
-- INSTRUÇÕES PARA TESTE
-- =====================================================

/*

OPÇÃO A: Teste via Página de Confirmação por Email (Recomendado)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Acesse: http://localhost:3000/rsvp-rj
   (ou https://seu-dominio.com/rsvp-rj na produção)

2. Digite o email: dumorro@gmail.com

3. Clique em "Confirmar Presença"

4. O sistema irá:
   - Confirmar a presença
   - Enviar o email automaticamente
   - Redirecionar para a página de confirmação

5. Verifique a caixa de entrada de dumorro@gmail.com


OPÇÃO B: Teste via API diretamente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use esta requisição HTTP:

POST http://localhost:3000/api/rsvp/confirm-by-email
Content-Type: application/json

{
  "email": "dumorro@gmail.com",
  "eventId": 1
}

Resposta esperada:
{
  "success": true,
  "message": "Presença confirmada com sucesso!",
  "guestGuid": "..."
}


OPÇÃO C: Reenviar Email via Admin (Se o convidado já confirmou)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Acesse: http://localhost:3000/admin

2. Faça login com a senha de admin

3. Busque por "dumorro" ou filtre por evento RJ

4. Encontre o convidado e clique em "Reenviar Email"


OPÇÃO D: Criar novo convidado via Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Acesse o Supabase Dashboard

2. Vá para Table Editor → guests

3. Clique em "Insert" → "Insert row"

4. Preencha:
   - guid: [auto-gerado]
   - name: "Teste Email RJ"
   - email: "dumorro@gmail.com"
   - event_id: 1
   - status: "pending"
   - qr_code: "TEST-RJ-001"

5. Salve e siga a Opção A ou B

*/

-- =====================================================
-- VERIFICAR SE O EMAIL FOI ENVIADO
-- =====================================================

-- Verificar logs de email (se existir a tabela)
SELECT
  recipient_email,
  recipient_name,
  status,
  sent_at,
  error_message
FROM email_logs
WHERE recipient_email = 'dumorro@gmail.com'
ORDER BY sent_at DESC
LIMIT 5;

-- =====================================================
-- CONTEÚDO ESPERADO DO EMAIL
-- =====================================================

/*

Assunto: Sua presença está confirmada! - Celebração do 1º Óleo de Bacalhau RJ 2025

Corpo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Presença Confirmada!

Olá [Nome do Convidado],

Sua presença está confirmada para o evento Celebração do 1º Óleo de Bacalhau RJ 2025.

📅 Data: 15/12/2024
⏰ Horário: 18:30
📍 Local: Rio de Janeiro

Para acessar o evento, apresente o QR Code abaixo na entrada:

[Imagem do Convite anexada]

─────────────────────────────────────────────────────

Hello [Nome do Convidado],

Your attendance is confirmed for the event Bacalhau First Oil Celebration.

📅 Date: 15/12/2024
⏰ Time: 18:30
📍 Location: Marina da Glória, Rio de Janeiro

To access the event, present the QR Code below at the entrance:

[Link para acessar o convite]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*/
