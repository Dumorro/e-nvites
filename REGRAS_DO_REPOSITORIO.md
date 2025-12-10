# Regras do Repositório

Este documento define as regras e melhores práticas para contribuir com o projeto **e-nvites**.

## 📋 Índice

- [1. Convenções de Código](#1-convenções-de-código)
- [2. Estrutura de Commits](#2-estrutura-de-commits)
- [3. Workflow de Desenvolvimento](#3-workflow-de-desenvolvimento)
- [4. Regras de Branching](#4-regras-de-branching)
- [5. Code Review](#5-code-review)
- [6. Testes](#6-testes)
- [7. Documentação](#7-documentação)
- [8. Segurança](#8-segurança)
- [9. Performance](#9-performance)

---

## 1. Convenções de Código

### 1.1. TypeScript

- **SEMPRE** use TypeScript. Evite `any` a menos que estritamente necessário
- Prefira interfaces explícitas definidas em `lib/supabase.ts`
- Use tipos de retorno explícitos em funções públicas

```typescript
// ✅ BOM
async function getGuest(guid: string): Promise<Guest | null> {
  // ...
}

// ❌ EVITAR
async function getGuest(guid: any) {
  // ...
}
```

### 1.2. Nomenclatura

- **Componentes React**: PascalCase (`AdminDashboard`, `GuestList`)
- **Funções/Variáveis**: camelCase (`getGuestByGuid`, `isLoading`)
- **Constantes**: UPPER_SNAKE_CASE (`ADMIN_PASSWORD`, `MAX_RETRIES`)
- **Arquivos**: kebab-case (`import-guests.tsx`, `confirm-rj.tsx`)

### 1.3. Estrutura de Arquivos

```
app/
├── admin/              # Páginas administrativas
├── api/                # API routes
├── rsvp-{slug}/        # Event-specific routes
├── confirm-{slug}/     # Event-specific confirmation pages
lib/                    # Utilities e configuração
scripts/                # Scripts de manutenção
```

### 1.4. Imports

Organize imports na seguinte ordem:

1. React e Next.js
2. Bibliotecas externas
3. Imports locais (lib, components)
4. Tipos

```typescript
// ✅ BOM
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import type { Guest, Event } from '@/lib/supabase'
```

### 1.5. Componentes

- **SEMPRE** use `'use client'` para componentes que usam hooks ou eventos
- Prefira componentes funcionais
- Extraia lógica complexa para custom hooks

```typescript
// ✅ BOM
'use client'

import { useState } from 'react'

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([])
  // ...
}
```

---

## 2. Estrutura de Commits

### 2.1. Formato de Commit Messages

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[footer opcional]
```

### 2.2. Tipos Permitidos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações em documentação
- `style`: Formatação, ponto e vírgula, etc (não afeta código)
- `refactor`: Refatoração de código
- `perf`: Melhoria de performance
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção, dependências

### 2.3. Exemplos

```bash
# ✅ BOM
feat(admin): adicionar filtro por evento no dashboard
fix(rsvp): corrigir validação de telefone brasileiro
docs: atualizar guia de importação CSV
perf(api): otimizar query de listagem de convidados

# ❌ EVITAR
Update files
Fix bug
Changes
WIP
```

### 2.4. Regras

- Use o imperativo ("adicionar" não "adicionado")
- Primeira linha com no máximo 72 caracteres
- Descrição em português (Brasil)
- Seja específico e descritivo

---

## 3. Workflow de Desenvolvimento

### 3.1. Antes de Começar

```bash
# 1. Atualize a branch principal
git checkout main
git pull origin main

# 2. Crie uma nova branch
git checkout -b feat/nome-da-feature

# 3. Instale/atualize dependências
npm install
```

### 3.2. Durante o Desenvolvimento

```bash
# Execute o ambiente de desenvolvimento
npm run dev

# Execute o linter regularmente
npm run lint

# Teste sua funcionalidade manualmente
```

### 3.3. Antes de Commitar

```bash
# 1. Verifique o status
git status

# 2. Execute o lint
npm run lint

# 3. Verifique se o build funciona
npm run build

# 4. Adicione os arquivos
git add .

# 5. Commit com mensagem descritiva
git commit -m "feat(admin): adicionar exportação de lista de convidados"

# 6. Push para o repositório
git push origin feat/nome-da-feature
```

---

## 4. Regras de Branching

### 4.1. Branch Principal

- **main**: Branch de produção
  - SEMPRE deve estar estável
  - NUNCA comite diretamente nesta branch
  - Somente merge via Pull Request

### 4.2. Branches de Desenvolvimento

Use prefixos descritivos:

- `feat/`: Nova funcionalidade
- `fix/`: Correção de bug
- `refactor/`: Refatoração
- `docs/`: Documentação
- `perf/`: Performance
- `chore/`: Manutenção

**Exemplos:**
```
feat/export-guest-list
fix/phone-validation
refactor/admin-dashboard
docs/setup-guide
perf/optimize-queries
chore/update-dependencies
```

### 4.3. Regras de Merge

- Pull Requests devem ter descrição clara
- Aguarde aprovação antes de fazer merge
- Delete a branch após merge
- Use "Squash and merge" para manter histórico limpo

---

## 5. Code Review

### 5.1. Checklist do Autor

Antes de abrir um Pull Request:

- [ ] Código testado localmente
- [ ] Build executado sem erros (`npm run build`)
- [ ] Lint passou sem erros (`npm run lint`)
- [ ] Documentação atualizada (se necessário)
- [ ] Commit messages seguem o padrão
- [ ] CHANGELOG.md atualizado (para features significativas)

### 5.2. Checklist do Revisor

Ao revisar um Pull Request:

- [ ] Código segue as convenções do projeto
- [ ] Lógica está clara e bem estruturada
- [ ] Não há vazamento de informações sensíveis
- [ ] Performance não foi degradada
- [ ] Tratamento de erros adequado
- [ ] Tipos TypeScript corretos

### 5.3. Comentários de Review

```markdown
# ✅ BOM
"Sugiro extrair essa lógica para uma função separada para melhor testabilidade"
"Atenção: este endpoint está expondo dados sensíveis sem autenticação"

# ❌ EVITAR
"Isso está errado"
"Não gostei"
```

---

## 6. Testes

### 6.1. Testes Manuais

Sempre teste manualmente:

1. **Página de RSVP**: Teste com GUID válido e inválido
2. **Admin Dashboard**: Teste filtros, busca, paginação
3. **APIs**: Teste com Postman ou curl
4. **Responsividade**: Teste em mobile e desktop

### 6.2. Cenários de Teste

Para cada feature, teste:

- ✅ **Caminho feliz**: Fluxo normal funciona
- ✅ **Erros**: Tratamento adequado de erros
- ✅ **Edge cases**: Dados vazios, valores extremos
- ✅ **Validações**: Inputs inválidos são rejeitados

### 6.3. Teste de Integração

```bash
# Teste o fluxo completo
1. Criar convidado via admin
2. Copiar link de convite
3. Acessar como convidado
4. Confirmar presença
5. Verificar no admin
```

---

## 7. Documentação

### 7.1. Quando Documentar

Documente quando:

- Adicionar nova funcionalidade
- Alterar API existente
- Modificar estrutura do banco
- Adicionar variável de ambiente
- Criar novo script

### 7.2. Arquivos de Documentação

- **README.md**: Visão geral do projeto
- **SETUP.md**: Guia de configuração
- **CHANGELOG.md**: Histórico de mudanças
- **CLAUDE.md**: Instruções para Claude Code
- **Guias específicos**: GUIA_*.md para tópicos específicos

### 7.3. Comentários no Código

```typescript
// ✅ BOM - Explica o "porquê"
// Usamos GUID em vez de ID sequencial para prevenir enumeração de convidados
const guid = crypto.randomUUID()

// ❌ EVITAR - Explica o "o quê" (óbvio)
// Define a variável guid
const guid = crypto.randomUUID()
```

### 7.4. Atualização de Documentação

- Atualize CHANGELOG.md para mudanças significativas
- Atualize README.md se adicionar comandos ou features
- Crie guias específicos para features complexas

---

## 8. Segurança

### 8.1. Regras Críticas

**NUNCA:**

- ❌ Comite credenciais, tokens, senhas
- ❌ Desabilite Row Level Security sem justificativa
- ❌ Exponha dados sensíveis em logs
- ❌ Use `eval()` ou código dinâmico não sanitizado
- ❌ Armazene senhas em plain text

**SEMPRE:**

- ✅ Use variáveis de ambiente para credenciais
- ✅ Valide inputs do usuário
- ✅ Sanitize dados antes de inserir no banco
- ✅ Use HTTPS em produção
- ✅ Implemente rate limiting em APIs

### 8.2. Checklist de Segurança

- [ ] `.env.local` está no `.gitignore`
- [ ] APIs sensíveis requerem autenticação
- [ ] Row Level Security habilitado no Supabase
- [ ] Validação de inputs em APIs
- [ ] Nenhum dado sensível em logs

### 8.3. Tratamento de Dados Sensíveis

```typescript
// ✅ BOM
const password = process.env.ADMIN_PASSWORD
if (req.headers['x-admin-password'] !== password) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

// ❌ EVITAR
console.log('User password:', userPassword) // NUNCA logue senhas
```

---

## 9. Performance

### 9.1. Regras Gerais

- Evite requisições desnecessárias ao banco
- Use paginação para listas grandes
- Implemente debouncing em buscas
- Otimize imagens (use Next.js Image)
- Minimize bundle size

### 9.2. Queries do Supabase

```typescript
// ✅ BOM - Select específico
const { data } = await supabase
  .from('guests')
  .select('id, name, email, status')
  .eq('event_id', eventId)
  .limit(20)

// ❌ EVITAR - Select *
const { data } = await supabase
  .from('guests')
  .select('*')
```

### 9.3. Otimizações de React

```typescript
// ✅ BOM - Memoização quando necessário
const filteredGuests = useMemo(
  () => guests.filter(g => g.status === status),
  [guests, status]
)

// ✅ BOM - Debouncing em buscas
const debouncedSearch = useMemo(
  () => debounce((term) => setSearchTerm(term), 300),
  []
)
```

### 9.4. Checklist de Performance

- [ ] Imagens otimizadas (<200KB)
- [ ] Listas grandes com paginação
- [ ] Buscas com debouncing
- [ ] Queries com índices apropriados
- [ ] Bundle size razoável (<500KB)

---

## 10. Contato e Dúvidas

Se tiver dúvidas sobre estas regras:

1. Consulte a documentação existente
2. Revise Pull Requests anteriores como referência
3. Pergunte ao time antes de proceder

---

## 11. Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/overview)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Última atualização:** 2025-12-10
