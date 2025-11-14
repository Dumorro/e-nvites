# Como Cadastrar os Eventos no Supabase

## Passo 1: Acessar o Supabase

1. Acesse: https://supabase.com/dashboard/project/hrucovxpenekzmxbatww
2. Faça login se necessário
3. Clique em **SQL Editor** no menu lateral esquerdo

## Passo 2: Executar o Schema Principal

1. Abra uma nova query no SQL Editor
2. Copie todo o conteúdo do arquivo `supabase-schema.sql`
3. Clique em **Run** (ou pressione Ctrl+Enter)
4. Aguarde a execução completar

**Resultado esperado:**
```
✅ Tables created: events, guests
✅ Indexes created
✅ Triggers created
✅ RLS policies created
✅ Sample data inserted
```

## Passo 3: Verificar os Eventos Cadastrados

Execute esta query para verificar:

```sql
SELECT
  id,
  name,
  slug,
  template_name,
  event_date,
  location,
  is_active,
  created_at
FROM events
ORDER BY created_at DESC;
```

**Resultado esperado:**

| id | name | slug | template_name | event_date | location |
|----|------|------|---------------|------------|----------|
| 1 | Festa de Confraternização RJ 2024 | festa-confraternizacao-rj-2024 | equinor-convite-RJ | 2024-12-20 19:00:00 | Rio de Janeiro |
| 2 | Festa de Confraternização SP 2024 | festa-confraternizacao-sp-2024 | equinor-convite-SP | 2024-12-22 19:00:00 | São Paulo |

## Passo 4: Verificar Relacionamento Guests ↔ Events

Execute esta query:

```sql
SELECT
  g.id,
  g.name as guest_name,
  g.status,
  g.social_event,
  e.name as event_name,
  e.template_name
FROM guests g
LEFT JOIN events e ON g.event_id = e.id
ORDER BY e.name, g.name;
```

**Resultado esperado:**
Todos os convidados devem estar vinculados a um evento através do `event_id`.

## Passo 5: (Opcional) Inserir Mais Convidados

Se quiser adicionar mais convidados para testar:

```sql
INSERT INTO guests (name, email, phone, social_event, event_id, status)
SELECT
  'Novo Convidado',
  'novo@email.com',
  '5511999887766',
  e.name,
  e.id,
  'pending'
FROM events e
WHERE e.slug = 'festa-confraternizacao-rj-2024'
LIMIT 1;
```

## Troubleshooting

### Problema: "relation events already exists"
**Solução:** Os eventos já foram criados. Pule para o Passo 3 para verificar.

### Problema: "guests.event_id está NULL"
**Solução:** Execute o UPDATE para vincular:

```sql
UPDATE guests
SET event_id = events.id
FROM events
WHERE guests.social_event = events.name
  AND guests.event_id IS NULL;
```

### Problema: "duplicate key value violates unique constraint"
**Solução:** Os dados já existem. Use UPDATE ao invés de INSERT:

```sql
UPDATE events
SET
  description = 'Nova descrição',
  event_date = '2024-12-20 19:00:00-03',
  updated_at = NOW()
WHERE slug = 'festa-confraternizacao-rj-2024';
```

## Estrutura dos Eventos Cadastrados

### Evento 1: Festa RJ
- **Nome:** Festa de Confraternização RJ 2024
- **Slug:** festa-confraternizacao-rj-2024
- **Template:** equinor-convite-RJ (corresponde ao arquivo `templates/equinor-convite-RJ.html`)
- **Data:** 20/12/2024 às 19:00
- **Local:** Rio de Janeiro, RJ
- **Cores:** Vermelho (#FF1243) e Azul (#243746)

### Evento 2: Festa SP
- **Nome:** Festa de Confraternização SP 2024
- **Slug:** festa-confraternizacao-sp-2024
- **Template:** equinor-convite-SP (corresponde ao arquivo `templates/equinor-convite-SP.html`)
- **Data:** 22/12/2024 às 19:00
- **Local:** São Paulo, SP
- **Cores:** Vermelho (#FF1243) e Azul (#243746)

## Próximos Passos Após Cadastrar

Depois de cadastrar os eventos no banco, você pode:

1. ✅ Atualizar `lib/supabase.ts` com os novos tipos
2. ✅ Criar as APIs de eventos (`/api/events`)
3. ✅ Refatorar a página de convite para usar os dados do evento
4. ✅ Implementar o painel admin para gerenciar eventos
5. ✅ Mover os botões de confirmação para dentro do card

Me avise quando terminar de executar o SQL e eu continuo com a implementação do código!
