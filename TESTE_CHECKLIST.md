# Checklist de Testes - Sistema de Email

## 📋 Antes de Testar

### Pré-requisitos
- [ ] Banco de dados Supabase está acessível
- [ ] Migration executada (tabela `email_logs` criada)
- [ ] API key do Resend configurada no `.env.local`
- [ ] Variável `SMTP_FROM_EMAIL` configurada com email válido
- [ ] Variável `NEXT_PUBLIC_SITE_URL` configurada corretamente
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)

---

## 🧪 Testes Funcionais

### 1. Envio Automático - Evento Rio de Janeiro (ID=1)

#### Preparação:
- [ ] Verificar que existe um convidado com email válido para Event ID = 1
- [ ] Garantir que o convidado não está confirmado ainda

#### Teste:
- [ ] Acessar `/rsvp-rj`
- [ ] Inserir email do convidado
- [ ] Clicar em "Confirmar"
- [ ] Observar logs do servidor (deve aparecer "✅ Confirmation email sent to...")

#### Validação:
- [ ] Email recebido na caixa de entrada
- [ ] Assunto: "Sua presença está confirmada! - [Nome do Evento]"
- [ ] Remetente: valor de `SMTP_FROM_NAME` <`SMTP_FROM_EMAIL`>
- [ ] Template bilíngue (PT e EN) visível
- [ ] QR Code visível e legível
- [ ] Link aponta para `/confirm-rj?guid=xxx`
- [ ] Data formatada em PT-BR (dd/mm/yyyy)
- [ ] Horário formatado em PT-BR (HH:mm)
- [ ] Nome do convidado correto
- [ ] Informações do evento corretas

#### Logs no Banco:
```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 1;
```
- [ ] Status = 'sent'
- [ ] recipient_email correto
- [ ] guest_id preenchido
- [ ] error_message = NULL

---

### 2. Envio Automático - Evento São Paulo (ID=2)

#### Preparação:
- [ ] Verificar que existe um convidado com email válido para Event ID = 2
- [ ] Garantir que o convidado não está confirmado ainda

#### Teste:
- [ ] Acessar `/rsvp-sp`
- [ ] Inserir email do convidado
- [ ] Clicar em "Confirmar"
- [ ] Observar logs do servidor

#### Validação:
- [ ] Email recebido
- [ ] Link aponta para `/confirm-sp?guid=xxx` (diferente do RJ!)
- [ ] Demais validações iguais ao teste 1

---

### 3. Reenvio Manual pelo Admin - Rio de Janeiro

#### Preparação:
- [ ] Ter pelo menos um convidado confirmado no Event ID = 1
- [ ] Conhecer a senha admin (padrão: `admin@123`)

#### Teste:
- [ ] Acessar `/admin`
- [ ] Fazer login com a senha admin
- [ ] Localizar um convidado confirmado do RJ
- [ ] Clicar no botão "📧 Reenviar Email"
- [ ] Confirmar o popup

#### Validação:
- [ ] Botão mostra "⏳ Enviando..." durante processo
- [ ] Alert de sucesso aparece
- [ ] Email recebido novamente
- [ ] Link correto para `/confirm-rj`

#### Logs no Banco:
```sql
SELECT * FROM email_logs WHERE guest_id = [ID_DO_CONVIDADO] ORDER BY sent_at DESC;
```
- [ ] Dois registros para o mesmo guest_id
- [ ] Ambos com status = 'sent'

---

### 4. Reenvio Manual pelo Admin - São Paulo

#### Teste:
- [ ] Repetir teste 3 para convidado de São Paulo
- [ ] Validar que link aponta para `/confirm-sp`

---

### 5. Tratamento de Erro - Email Inválido no Resend

#### Preparação:
- [ ] Temporariamente configurar `RESEND_API_KEY` com valor inválido

#### Teste:
- [ ] Tentar confirmar presença de um convidado
- [ ] Observar logs do servidor

#### Validação:
- [ ] Confirmação deve ter SUCESSO (não bloqueia)
- [ ] Logs mostram "❌ Failed to send confirmation email to..."
- [ ] Usuário é redirecionado normalmente para página de confirmação

#### Logs no Banco:
```sql
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY sent_at DESC LIMIT 1;
```
- [ ] Status = 'failed'
- [ ] error_message contém descrição do erro

#### Cleanup:
- [ ] Restaurar `RESEND_API_KEY` correto

---

### 6. Convidado sem Email

#### Preparação:
- [ ] Criar/modificar um convidado sem email (email = NULL)

#### Teste:
- [ ] Confirmar presença desse convidado (se possível via admin)

#### Validação:
- [ ] Confirmação funciona normalmente
- [ ] Nenhum email é enviado
- [ ] Não há erro no console
- [ ] No painel admin, botão mostra "Sem email" (não permite reenvio)

---

### 7. Evento sem Data Definida

#### Preparação:
- [ ] Criar evento com `event_date = NULL`

#### Teste:
- [ ] Confirmar presença de convidado para esse evento

#### Validação:
- [ ] Email enviado normalmente
- [ ] Data aparece vazia ou com valor padrão
- [ ] Horário mostra fallback '18:30'
- [ ] Não há erro no console

---

### 8. QR Code Gerado Corretamente

#### Validação:
- [ ] Abrir email recebido
- [ ] QR Code está visível (não quebrado)
- [ ] QR Code tem bordas arredondadas e padding
- [ ] Escanear QR Code com celular
- [ ] Conteúdo do QR Code é o valor de `guest.qr_code` ou `guest.guid`

---

### 9. Responsividade do Email

#### Teste em Diferentes Clientes:
- [ ] Gmail (Desktop)
- [ ] Gmail (Mobile)
- [ ] Outlook (Desktop)
- [ ] Apple Mail (iOS)
- [ ] Webmail

#### Validação:
- [ ] Template renderiza corretamente em todos
- [ ] QR Code visível em todos
- [ ] Textos legíveis
- [ ] Botões/links clicáveis

---

### 10. Performance - Múltiplos Envios

#### Teste:
- [ ] Confirmar presença de 5 convidados rapidamente
- [ ] Observar tempo de resposta

#### Validação:
- [ ] Cada confirmação retorna em < 2s
- [ ] Emails são enviados em background (não bloqueiam)
- [ ] Todos os 5 emails chegam eventualmente

---

## 🔒 Testes de Segurança

### 11. Autenticação Admin

#### Teste 1: Senha Incorreta
- [ ] Tentar acessar `/api/email/send-confirmation` sem header
- [ ] Validar retorno 401 Unauthorized

#### Teste 2: Senha Correta
- [ ] Enviar requisição com header `x-admin-password: admin@123`
- [ ] Validar retorno 200 ou 400 (dependendo dos dados)

---

### 12. Validação de Inputs

#### Email Malicioso
```bash
POST /api/rsvp/confirm-by-email
{
  "email": "<script>alert('xss')</script>",
  "eventId": 1
}
```
- [ ] Não encontra convidado (esperado)
- [ ] Não executa script
- [ ] Retorna erro apropriado

#### Event ID Inválido
```bash
POST /api/rsvp/confirm-by-email
{
  "email": "valido@email.com",
  "eventId": 9999
}
```
- [ ] Retorna erro 404 "Evento não encontrado"

---

## 🚀 Testes de Deploy

### 13. Build de Produção

```bash
npm run build
```
- [ ] Build completa sem erros
- [ ] Sem warnings de TypeScript
- [ ] Todas as rotas geradas

### 14. Variáveis de Ambiente (Vercel)

- [ ] `RESEND_API_KEY` configurada
- [ ] `SMTP_FROM_EMAIL` configurada
- [ ] `SMTP_FROM_NAME` configurada
- [ ] `NEXT_PUBLIC_SITE_URL` configurada
- [ ] `ADMIN_PASSWORD` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada

### 15. Teste em Staging/Preview

- [ ] Deploy em ambiente de staging
- [ ] Confirmar presença de teste
- [ ] Receber email
- [ ] Verificar link funciona em produção

---

## 📊 Resultados Esperados

### ✅ Sucesso Total
- Todos os checkboxes marcados
- Emails recebidos consistentemente
- Logs sem erros
- Performance aceitável (< 2s por confirmação)
- Compatibilidade com principais clientes de email

### ⚠️ Sucesso Parcial
- Alguns clientes de email renderizam mal (aceitável)
- Ocasionais delays no envio (< 5% dos casos)
- Necessidade de retry manual em casos raros

### ❌ Falha
- Emails não são enviados
- Erros de build/runtime
- Confirmações bloqueadas por falhas de email
- Links incorretos (RJ/SP trocados)

---

## 🐛 Relatório de Bugs

Se encontrar problemas, documente:

```
## Bug Report

**Descrição:** [Descrever o problema]

**Passos para Reproduzir:**
1.
2.
3.

**Resultado Esperado:** [O que deveria acontecer]

**Resultado Atual:** [O que aconteceu]

**Logs do Console:**
```
[Colar logs relevantes]
```

**Logs do Banco:**
```sql
[Query e resultado]
```

**Ambiente:**
- Node.js version:
- Next.js version:
- Navegador:
- Sistema Operacional:
```

---

## 📞 Suporte

Se precisar de ajuda durante os testes:

1. Verificar logs do servidor (`npm run dev`)
2. Consultar [EMAIL_IMPLEMENTATION.md](EMAIL_IMPLEMENTATION.md)
3. Verificar [CORREÇÕES_APLICADAS.md](CORREÇÕES_APLICADAS.md)
4. Verificar logs no Supabase (tabela `email_logs`)
5. Verificar dashboard do Resend

---

**Última Atualização:** 2025-11-15
**Status:** Pronto para Testes
