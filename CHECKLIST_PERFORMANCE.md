# Checklist de Otimização de Performance

Este documento é um guia passo a passo para aplicar todas as otimizações de performance no banco de dados.

## 📋 Pré-requisitos

- [ ] Acesso ao Supabase Dashboard
- [ ] Permissões de administrador no banco de dados
- [ ] Backup recente do banco (recomendado)

## 🗂️ Passo 1: Aplicar Migração de Coluna Base64

### O que faz
Adiciona a coluna `invite_image_base64` para armazenar imagens no banco de dados (resolve problema do Vercel).

### Como aplicar

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Clique em **New query**
4. Copie o conteúdo de [`migrations/add_invite_image_column.sql`](migrations/add_invite_image_column.sql)
5. Cole no editor
6. Clique em **Run**

### Verificar sucesso

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests' AND column_name = 'invite_image_base64';
```

**Resultado esperado:** 1 linha mostrando a coluna `invite_image_base64` do tipo `text` e `is_nullable = YES`

**Status:** [ ] Concluído

---

## 🚀 Passo 2: Criar Índices de Performance

### O que faz
Cria 18 índices para otimizar queries críticas (GUID lookup, filtros, ordenação).

### Como aplicar

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Clique em **New query**
4. Copie o conteúdo de [`migrations/create_indexes.sql`](migrations/create_indexes.sql)
5. Cole no editor
6. Clique em **Run**

**Tempo estimado:** 1-5 segundos

### Verificar sucesso

```sql
SELECT COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

**Resultado esperado:** `total_indices` deve ser >= 18

**Status:** [ ] Concluído

---

## 📊 Passo 3: Monitorar Performance (Opcional)

### O que faz
Verifica se os índices estão sendo usados e identifica problemas de performance.

### Como usar

1. Aguarde alguns dias de uso em produção
2. Execute queries do arquivo [`migrations/monitor_indexes.sql`](migrations/monitor_indexes.sql)
3. Analise os resultados:
   - **Cache Hit Ratio:** Deve ser > 99%
   - **Índices não utilizados:** Considere remover se `idx_scan = 0`
   - **Tuplas mortas:** Execute VACUUM ANALYZE se > 10%

**Status:** [ ] Agendado para: ___________

---

## 🧪 Passo 4: Testar Funcionalidades

Após aplicar as migrações, teste estas funcionalidades:

### 4.1 Upload de Convites
1. [ ] Acesse `/admin` (faça login)
2. [ ] Clique em "Upload de Convites"
3. [ ] Selecione um evento
4. [ ] Faça upload de um arquivo ZIP com imagens
5. [ ] Verifique estatísticas: "Processados", "Atualizados", "Não Encontrados"

### 4.2 Envio de Email com Anexo
1. [ ] Confirme presença de um convidado que tem imagem no banco
2. [ ] Verifique que o email foi enviado com anexo
3. [ ] Abra o email e baixe o anexo
4. [ ] Confirme que a imagem está correta

### 4.3 Download de Convite
1. [ ] Acesse a página de confirmação de um convidado
2. [ ] Clique em "Acessar meu convite" ou "Clique"
3. [ ] Verifique que o download iniciou
4. [ ] Abra a imagem baixada e confirme que está correta

### 4.4 Performance do Admin
1. [ ] Acesse `/admin`
2. [ ] Filtre por evento específico
3. [ ] Filtre por status (confirmados, pendentes, declinados)
4. [ ] Ordene por nome
5. [ ] Verifique que tudo carrega rapidamente (< 1 segundo)

**Status:** [ ] Todos os testes passaram

---

## 📈 Ganhos Esperados

Após aplicar todas as otimizações:

| Operação | Antes | Depois | Melhoria |
|----------|-------|--------|----------|
| Busca por GUID (link de convite) | 50-500ms | < 10ms | **50-100x** |
| Busca por email + evento | 50-500ms | < 10ms | **50-100x** |
| Upload de imagens | ❌ Falha no Vercel | ✅ Funciona | **100%** |
| Admin dashboard (filtros) | 100-1000ms | < 50ms | **20-50x** |
| Envio de email com anexo | ❌ Falha | ✅ Funciona | **100%** |

---

## 🔍 Troubleshooting

### Erro ao criar índices

**Problema:** `ERROR: relation "idx_guests_guid" already exists`

**Solução:** Índice já existe, pode ignorar ou usar `DROP INDEX IF EXISTS idx_guests_guid;` antes de criar.

---

### Upload ainda falha no Vercel

**Problema:** Erro ao fazer upload de ZIP

**Verificar:**
1. [ ] Migração `add_invite_image_column.sql` foi aplicada?
2. [ ] Admin page está usando endpoint `/api/admin/upload-invites-db`?
3. [ ] Nomes dos arquivos seguem padrão `{qr_code}-{event-slug}.{ext}`?

**Logs:** Verifique logs no Vercel Dashboard

---

### Email sem anexo

**Problema:** Email é enviado mas sem a imagem anexada

**Verificar:**
1. [ ] Convidado tem `invite_image_base64` preenchido no banco?
   ```sql
   SELECT qr_code, LENGTH(invite_image_base64) as tamanho_base64
   FROM guests
   WHERE qr_code = 'SEU_QR_CODE';
   ```
2. [ ] `invite_image_base64` começa com `data:image/` ?
3. [ ] Fazer novo upload da imagem

---

### Queries ainda lentas

**Problema:** Admin dashboard ou confirmações ainda demoram

**Verificar:**
1. [ ] Índices foram criados com sucesso? (Query do Passo 2)
2. [ ] Execute VACUUM ANALYZE:
   ```sql
   VACUUM ANALYZE guests;
   VACUUM ANALYZE events;
   VACUUM ANALYZE email_logs;
   ```
3. [ ] Verifique uso dos índices com [`monitor_indexes.sql`](migrations/monitor_indexes.sql)
4. [ ] Verifique Cache Hit Ratio (deve ser > 99%)

---

## 📚 Documentação Adicional

- [`GUIA_BASE64_IMAGES.md`](GUIA_BASE64_IMAGES.md) - Detalhes sobre armazenamento de imagens em base64
- [`GUIA_INDICES.md`](GUIA_INDICES.md) - Explicação detalhada de cada índice
- [`migrations/README.md`](migrations/README.md) - Guia de migrações
- [`migrations/monitor_indexes.sql`](migrations/monitor_indexes.sql) - Scripts de monitoramento

---

## ✅ Checklist Final

Antes de considerar a otimização completa:

- [ ] Migração de coluna base64 aplicada
- [ ] Todos os 18 índices criados
- [ ] Upload de convites testado e funcionando
- [ ] Email com anexo testado e funcionando
- [ ] Download de convite testado e funcionando
- [ ] Admin dashboard testado (filtros e ordenação)
- [ ] Performance melhorou visivelmente
- [ ] Monitoramento agendado para daqui a 1 semana

---

## 🎯 Próximos Passos (Opcional)

Melhorias futuras que podem ser consideradas:

1. **Full-Text Search:** Descomentar índices GIN em `create_indexes.sql` para busca avançada
2. **CDN para Imagens:** Considerar Cloudinary ou similar se volume de imagens crescer muito
3. **Caching:** Implementar Redis/Upstash para cache de consultas frequentes
4. **Compressão de Imagens:** Comprimir imagens antes de converter para base64
5. **Lazy Loading:** Carregar imagens sob demanda no admin dashboard

---

**Data de aplicação:** ___________

**Aplicado por:** ___________

**Resultado:** [ ] Sucesso  [ ] Parcial  [ ] Falhou

**Observações:**
```
_________________________________________________________
_________________________________________________________
_________________________________________________________
```
