# Atualizar Data do Evento Oil Celebration RJ

## ✅ Correção: Data 15/12/2024 às 18:30

### Passo 1: Executar Script SQL

1. Acesse **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute um dos scripts abaixo:

#### Opção A: Script Direto (Mais Rápido)

```sql
-- Atualizar apenas o evento RJ
UPDATE events
SET
  event_date = '2024-12-15 18:30:00',
  updated_at = NOW()
WHERE id = 1;

-- Verificar
SELECT
  id,
  name,
  TO_CHAR(event_date, 'DD/MM/YYYY HH24:MI') AS data_no_email
FROM events
WHERE id = 1;
```

#### Opção B: Script com Verificação

Use o arquivo: **[migrations/update_oil_celebration_rj_date.sql](migrations/update_oil_celebration_rj_date.sql)**

Este script:
- ✅ Mostra a data atual
- ✅ Atualiza para a nova data
- ✅ Verifica se foi atualizado

### Passo 2: Testar

1. Acesse `/rsvp-rj` ou `/?guid={algum-guid-do-evento-rj}`
2. Confirme presença com um email de teste
3. Verifique o email recebido
4. Confirme que mostra:

```
📅 Data: 15/12/2024
⏰ Horário: 18:30
📍 Local: Marina da Glória, Rio de Janeiro
```

### Resultado

Após executar o script, **todos os novos emails** para o evento RJ mostrarão a data correta: **15/12/2024 às 18:30**.

## ⚠️ Notas Importantes

### Emails já enviados
Os emails **já enviados** não serão alterados. Apenas os novos emails enviados após a atualização mostrarão a nova data.

Se precisar reenviar emails com a data correta:
1. Acesse `/admin`
2. Filtre por evento "Rio de Janeiro"
3. Filtre por status "Confirmado"
4. Clique em "Reenviar Email" para cada convidado

### Outros Eventos

Se precisar atualizar São Paulo ou Festa de Fim de Ano, use:

**[migrations/update_all_event_dates.sql](migrations/update_all_event_dates.sql)**

Descomente as seções correspondentes e ajuste as datas.

### Formato de Data

**Sempre use o formato:** `YYYY-MM-DD HH:MM:SS`

✅ Correto: `2024-12-15 18:30:00`
❌ Errado: `15/12/2024 18:30`
❌ Errado: `12-15-2024 18:30`

### Timezone

A data é armazenada como está. Se você inserir `18:30:00`, o email mostrará `18:30`.

Não há conversão de timezone para horário de Brasília.

## 📚 Documentação Adicional

- **[DATAS_EVENTOS_EMAIL.md](DATAS_EVENTOS_EMAIL.md)** - Guia completo sobre datas nos emails
- **[migrations/check_event_dates.sql](migrations/check_event_dates.sql)** - Verificar todas as datas

## ✅ Checklist

- [ ] Executei o script SQL no Supabase
- [ ] Verifiquei que a data foi atualizada corretamente
- [ ] Testei enviando um email de confirmação
- [ ] Confirmei que o email mostra 15/12/2024 às 18:30
- [ ] Informei a equipe sobre a mudança de data

---

**Data de atualização:** ___________

**Atualizado por:** ___________
