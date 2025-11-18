# ✅ Datas dos Eventos Atualizadas

## 📅 Novas Datas Confirmadas

### Evento 1: Celebração do 1º Óleo de Bacalhau RJ 2025
```
📅 Data: 15/12/2024
⏰ Horário: 18:30
📍 Local: Rio de Janeiro
🔗 Página: /rsvp-rj
```

### Evento 2: Celebração do 1º Óleo de Bacalhau SP 2025
```
📅 Data: 11/12/2024
⏰ Horário: 19:00
📍 Local: São Paulo
🔗 Página: /rsvp-sp
```

### Evento 3: Festa de Final de Ano
```
📅 Data: 02/12/2025
⏰ Horário: 19:30
📍 Local: Marina da Gloria - Rio de Janeiro
🔗 Página: /rsvp-festa
```

## 🚀 Script de Atualização

Execute no **Supabase SQL Editor**:

### Opção 1: Copiar e Colar

```sql
-- Atualizar Evento RJ
UPDATE events
SET event_date = '2024-12-15 18:30:00', name = 'Celebração do 1º Óleo de Bacalhau RJ 2025', location = 'Rio de Janeiro', updated_at = NOW()
WHERE id = 1;

-- Atualizar Evento SP
UPDATE events
SET event_date = '2024-12-11 19:00:00', name = 'Celebração do 1º Óleo de Bacalhau SP 2025', location = 'São Paulo', updated_at = NOW()
WHERE id = 2;

-- Atualizar Festa de Final de Ano
UPDATE events
SET event_date = '2025-12-02 19:30:00', name = 'Festa de Final de Ano', location = 'Marina da Gloria - Rio de Janeiro', updated_at = NOW()
WHERE id = 7;

-- Verificar se foi atualizado
SELECT id, name, TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_no_email, location FROM events WHERE id IN (1, 2, 7) ORDER BY event_date;
```

### Opção 2: Usar Arquivo

Use o arquivo: **[migrations/update_all_events_final.sql](migrations/update_all_events_final.sql)**

Este script inclui:
- ✅ Verificação das datas atuais
- ✅ Atualização dos 3 eventos
- ✅ Verificação pós-atualização
- ✅ Estatísticas de convidados por evento

## ⚠️ Observações Importantes

### 1. Festa de Final de Ano em 2025

**A Festa está agendada para 02/12/2025 (ano que vem).**

Se isso estiver incorreto e deveria ser em 2024, execute:

```sql
UPDATE events
SET event_date = '2024-12-02 19:30:00'
WHERE id = 7;
```

### 2. Ordem dos Eventos

Os eventos estão ordenados cronologicamente:

1. **SP** - 11/12/2024 (primeiro)
2. **RJ** - 15/12/2024 (4 dias depois)
3. **Festa** - 02/12/2025 (quase 1 ano depois)

### 3. Nomes Atualizados

Os nomes dos eventos foram atualizados para incluir "2025":
- ✅ "Celebração do 1º Óleo de Bacalhau RJ **2025**"
- ✅ "Celebração do 1º Óleo de Bacalhau SP **2025**"

### 4. Localização da Festa

A localização foi atualizada para: **"Marina da Gloria - Rio de Janeiro"**

(Anteriormente era apenas "Marina da Glória")

## 📧 Impacto nos Emails

### Emails Futuros

Todos os **novos emails** enviados após a atualização mostrarão as datas corretas.

### Emails Já Enviados

Os emails **já enviados** não serão alterados automaticamente.

#### Como Reenviar Emails

Se precisar reenviar para convidados que já receberam email com data incorreta:

1. Acesse **`/admin`**
2. Filtre por **Evento** (RJ, SP ou Festa)
3. Filtre por **Status: Confirmados**
4. Clique em **"Reenviar Email"** para cada convidado

**Dica:** Priorize reenviar para quem já confirmou presença.

## ✅ Checklist de Verificação

Após executar o script SQL:

- [ ] Executei o script no Supabase
- [ ] Verifiquei que as 3 datas foram atualizadas
- [ ] Confirmei que a Festa é realmente em **2025** (ou corrigi para 2024)
- [ ] Testei enviando um email de confirmação para cada evento
- [ ] Verifiquei que os emails mostram as datas corretas
- [ ] Informei a equipe sobre as novas datas
- [ ] Considerei reenviar emails para quem já confirmou

## 🧪 Testar

Para testar cada evento:

### Teste RJ
1. Acesse `/rsvp-rj`
2. Confirme com email de teste
3. Verifique email: deve mostrar **15/12/2024 às 18:30**

### Teste SP
1. Acesse `/rsvp-sp`
2. Confirme com email de teste
3. Verifique email: deve mostrar **11/12/2024 às 19:00**

### Teste Festa
1. Acesse `/rsvp-festa`
2. Confirme com email de teste
3. Verifique email: deve mostrar **02/12/2025 às 19:30**

## 📊 Estatísticas

Após a atualização, você pode verificar quantos convidados cada evento tem:

```sql
SELECT
  e.name,
  TO_CHAR(e.event_date, 'DD/MM/YYYY HH24:MI') AS data_evento,
  COUNT(g.id) AS total_convidados,
  COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END) AS confirmados
FROM events e
LEFT JOIN guests g ON g.event_id = e.id
WHERE e.id IN (1, 2, 7)
GROUP BY e.id, e.name, e.event_date
ORDER BY e.event_date;
```

## 📚 Documentação Relacionada

- **[DATAS_EVENTOS_EMAIL.md](DATAS_EVENTOS_EMAIL.md)** - Como as datas funcionam nos emails
- **[migrations/check_event_dates.sql](migrations/check_event_dates.sql)** - Script para verificar datas
- **[ATUALIZAR_DATA_RJ.md](ATUALIZAR_DATA_RJ.md)** - Guia de atualização do evento RJ

---

**Data de atualização:** ___________

**Atualizado por:** ___________

**Conferência:** [ ] SP: 11/12  [ ] RJ: 15/12  [ ] Festa: 02/12/**2025**
