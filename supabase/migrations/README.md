# 📁 Migrations SQL - Sistema de Eventos RSVP

Esta pasta contém todas as migrations SQL para o banco de dados do sistema.

## 📋 Ordem de Execução

Execute os scripts **na ordem numérica** no Supabase SQL Editor:

### 1️⃣ `000_full_schema.sql` - Schema Completo (Opcional)
**Quando usar:** Primeira instalação em um banco vazio

**O que faz:**
- Cria função `update_updated_at_column()`
- Cria tabela `events`
- Cria/atualiza tabela `guests` com `event_id`
- Configura Row Level Security (RLS)
- Insere 2 eventos de exemplo (RJ e SP)
- Insere 5 convidados de exemplo

**Executar:**
```bash
# No Supabase SQL Editor
# Cole o conteúdo de 000_full_schema.sql
```

---

### 2️⃣ `001_create_events_and_migrate.sql` - Criação e Migração
**Quando usar:** Banco com dados existentes (tabela `guests` já existe)

**O que faz:**
- ✅ Verifica se `event_id` já existe antes de criar
- ✅ Cria tabela `events`
- ✅ Adiciona coluna `event_id` à tabela `guests` existente
- ✅ Cria foreign key entre `guests` e `events`
- ✅ Insere 2 eventos (RJ e SP)
- ✅ Migra dados existentes (cria eventos a partir de `social_event`)
- ✅ Vincula convidados aos eventos
- ✅ Exibe relatórios de verificação

**Executar:**
```bash
# No Supabase SQL Editor
# Cole o conteúdo de 001_create_events_and_migrate.sql
```

---

### 3️⃣ `002_insert_sample_guests.sql` - Massa de Dados
**Quando usar:** Após executar a migration 001

**O que faz:**
- Insere **20 convidados para o Evento RJ** (event_id = 1)
  - 10 Confirmados
  - 7 Pendentes
  - 3 Recusados

- Insere **22 convidados para o Evento SP** (event_id = 2)
  - 13 Confirmados
  - 7 Pendentes
  - 2 Recusados

- Exibe estatísticas detalhadas por evento

**Executar:**
```bash
# No Supabase SQL Editor
# Cole o conteúdo de 002_insert_sample_guests.sql
```

---

## 🎯 Guia Rápido

### Cenário 1: Banco Vazio (Primeira Instalação)
```
✅ Execute: 000_full_schema.sql
✅ Execute: 002_insert_sample_guests.sql
```

### Cenário 2: Banco com Dados (Migração)
```
✅ Execute: 001_create_events_and_migrate.sql
✅ Execute: 002_insert_sample_guests.sql
```

### Cenário 3: Apenas Adicionar Convidados
```
✅ Execute: 002_insert_sample_guests.sql
```

---

## 📊 Dados Gerados

### Evento 1: Festa de Confraternização RJ 2024
- **ID:** 1
- **Slug:** `festa-confraternizacao-rj-2024`
- **Template:** `equinor-convite-RJ`
- **Local:** Rio de Janeiro
- **Data:** 20/12/2024 19:00
- **Convidados:** 20

### Evento 2: Festa de Confraternização SP 2024
- **ID:** 2
- **Slug:** `festa-confraternizacao-sp-2024`
- **Template:** `equinor-convite-SP`
- **Local:** São Paulo
- **Data:** 22/12/2024 19:00
- **Convidados:** 22

---

## 🔍 Queries Úteis

### Verificar Eventos
```sql
SELECT * FROM events ORDER BY event_date;
```

### Verificar Convidados por Evento
```sql
SELECT
  e.name as evento,
  COUNT(g.id) as total,
  SUM(CASE WHEN g.status = 'confirmed' THEN 1 ELSE 0 END) as confirmados
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
GROUP BY e.name;
```

### Verificar Convidados Sem Evento
```sql
SELECT * FROM guests WHERE event_id IS NULL;
```

### Ver GUIDs dos Convites
```sql
SELECT
  g.name,
  g.guid,
  e.name as evento,
  'http://localhost:3000/?guid=' || g.guid as link_convite
FROM guests g
JOIN events e ON g.event_id = e.id
ORDER BY e.id, g.name
LIMIT 10;
```

---

## 🆘 Troubleshooting

### Erro: "column event_id does not exist"
**Solução:** Execute `001_create_events_and_migrate.sql`

### Erro: "relation events already exists"
**Solução:** Pule para `002_insert_sample_guests.sql`

### Erro: "duplicate key value violates unique constraint"
**Solução:** Os dados já existem. Execute apenas as queries de verificação.

### Convidados não estão vinculados aos eventos
**Solução:** Execute manualmente:
```sql
UPDATE guests
SET event_id = events.id
FROM events
WHERE guests.social_event = events.name
  AND guests.event_id IS NULL;
```

---

## 📝 Estrutura Final

```
events (tabela)
├── id
├── name
├── slug
├── template_name
├── event_date
├── location
└── ... (outros campos)

guests (tabela)
├── id
├── guid (para links de convite)
├── name
├── email
├── phone
├── social_event (legado)
├── event_id → FK para events.id
└── status (pending/confirmed/declined)
```

---

## ✅ Checklist de Migração

- [ ] Backup do banco atual
- [ ] Executar migration 001 ou 000
- [ ] Verificar se eventos foram criados
- [ ] Verificar se `event_id` foi adicionado
- [ ] Executar migration 002
- [ ] Verificar estatísticas
- [ ] Testar links de convite
- [ ] Atualizar código da aplicação

---

🎉 Após executar as migrations, você terá 2 eventos configurados com 42 convidados de exemplo para testar!
