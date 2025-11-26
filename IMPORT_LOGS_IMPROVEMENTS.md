# Melhorias no Sistema de Logs de Importação

## Resumo das Melhorias

O sistema de logs de importação de convidados foi aprimorado significativamente com informações mais detalhadas e categorizadas.

---

## 🎯 Novas Funcionalidades

### 1. **Categorização de Erros**
Agora os erros são classificados em 3 tipos:

- **`validation`** - Erros de validação (campos obrigatórios, formato de email, etc.)
- **`parsing`** - Erros ao processar o arquivo CSV (formato incorreto, colunas faltando)
- **`duplicate`** - Violações de constraint única (QR Code ou email duplicado no mesmo evento)

### 2. **Validação de Email**
Adicionada validação de formato de email durante o parsing:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
- Emails inválidos são rejeitados antes da inserção no banco
- Previne erros de constraint única para emails malformados

### 3. **Detecção de Duplicatas Melhorada**
O sistema agora detecta dois tipos de duplicatas:

- **QR Code duplicado** (`idx_guests_qr_code_event_unique`)
- **Email duplicado** (`idx_guests_unique_email_per_event`) ✨ **NOVO**

Mensagens de erro específicas para cada tipo.

### 4. **Métricas de Performance**
Logs agora incluem:

- **Duração total** da importação (ms ou segundos)
- **Tempo médio por guest** inserido
- Exibido tanto no console quanto na interface

### 5. **Resumo Estatístico Detalhado**
Nova estrutura `ImportSummary` com breakdown completo:

```typescript
{
  success: number          // Guests inseridos com sucesso
  skipped: number          // Linhas ignoradas (total de erros)
  duplicates: number       // Quantidade de erros por duplicação
  validationErrors: number // Quantidade de erros de validação
  parseErrors: number      // Quantidade de erros de parsing
}
```

### 6. **Informações Contextuais nos Erros**
Cada erro agora pode incluir:

```typescript
{
  row: number           // Linha do CSV
  qrCode?: string       // QR Code (se disponível)
  name?: string         // Nome (se disponível)
  type: 'validation' | 'parsing' | 'duplicate'
  error: string         // Mensagem descritiva
}
```

### 7. **Logs em Caso de Erro Crítico**
Erros inesperados (exceções não capturadas) agora:

- São registrados no banco de dados
- Incluem stack trace completo
- Marcados como status `'failed'`

### 8. **Console Logs Aprimorados**
Logs no servidor agora mostram:

```
📊 [Import Guests] Processing 150 rows for event 1
   File: convidados.csv (45.23 KB)
   → Parsed: 145 valid, 5 errors
   → Breakdown: 3 validation, 2 parsing
   → Executing bulk INSERT for 145 guests
✅ [Import Guests] Successfully inserted 145 guests
   Duration: 2345ms (16.17ms per guest)
   Summary: 145 success, 5 skipped
```

---

## 🎨 Interface de Visualização

### Modal de Detalhes Melhorado

O modal de detalhes de importação agora exibe:

#### 1. **Métricas de Performance**
- Duração total da importação
- Tempo médio por guest (quando aplicável)

#### 2. **Grid de Resumo Visual**
Cards coloridos por categoria:
- 🟢 **Sucesso** (verde)
- 🔴 **Ignorados** (vermelho)
- 🟠 **Duplicados** (laranja) - *aparece apenas se > 0*
- 🔴 **Validação** (vermelho) - *aparece apenas se > 0*
- 🟡 **Parsing** (amarelo) - *aparece apenas se > 0*

#### 3. **Lista de Erros com Badges**
Cada erro mostra:
- **Badge colorido** indicando o tipo (DUPLICADO, VALIDAÇÃO, PARSING)
- **Linha do CSV** onde ocorreu o erro
- **Mensagem** descritiva do erro
- **Contexto adicional** (QR Code e Nome, quando disponível)

Exemplo:
```
[VALIDAÇÃO] Linha 23: Email inválido: joao@exemplo
QR Code: QR123 | Nome: João Silva
```

---

## 📦 Estrutura de Dados no Banco

### Nova estrutura de `error_details` (JSONB)

```json
{
  "errors": [
    {
      "row": 23,
      "qrCode": "QR123",
      "name": "João Silva",
      "type": "validation",
      "error": "Email inválido: joao@exemplo"
    }
  ],
  "summary": {
    "success": 145,
    "skipped": 5,
    "duplicates": 0,
    "validationErrors": 3,
    "parseErrors": 2
  },
  "duration_ms": 2345,
  "avg_time_per_guest": 16.17
}
```

### Retrocompatibilidade

O sistema mantém compatibilidade com logs antigos:
- Detecta automaticamente o formato (antigo vs. novo)
- Exibe corretamente ambos os formatos na interface
- Formato antigo: array simples de `{ row, error }`

---

## 🚀 Benefícios

1. **Debugging Facilitado**
   - Identificação rápida do tipo de erro
   - Contexto adicional (QR Code, Nome) para localizar registros problemáticos

2. **Transparência para o Usuário**
   - Breakdown claro de o que funcionou e o que falhou
   - Métricas de performance para auditar grandes importações

3. **Rastreabilidade**
   - Todos os erros são persistidos no banco
   - Stack traces de erros críticos salvos para análise

4. **Prevenção de Duplicatas**
   - Validação de email antes da inserção
   - Mensagens específicas para cada tipo de duplicata

5. **Performance Monitoring**
   - Rastreamento de tempo de execução
   - Identificação de importações lentas

---

## 🔧 Arquivos Modificados

- [app/api/admin/import-guests/route.ts](app/api/admin/import-guests/route.ts) - API de importação com validação e logs melhorados
- [app/admin/import-logs/page.tsx](app/admin/import-logs/page.tsx) - Interface visual aprimorada
- [migrations/add-unique-email-per-event.sql](migrations/add-unique-email-per-event.sql) - Constraint única para email por evento

---

## 📋 Exemplo de Uso

### Importação com Sucesso Total
```json
{
  "success": true,
  "message": "150 convidado(s) importado(s) com sucesso!",
  "stats": {
    "totalRows": 150,
    "inserted": 150,
    "errors": 0,
    "errorDetails": [],
    "summary": {
      "success": 150,
      "skipped": 0,
      "duplicates": 0,
      "validationErrors": 0,
      "parseErrors": 0
    },
    "duration": 2345
  }
}
```

### Importação Parcial (com erros)
```json
{
  "success": true,
  "message": "145 convidado(s) importado(s) com sucesso!",
  "stats": {
    "totalRows": 150,
    "inserted": 145,
    "errors": 5,
    "errorDetails": [
      {
        "row": 23,
        "qrCode": "QR123",
        "name": "João Silva",
        "type": "validation",
        "error": "Email inválido: joao@exemplo"
      },
      {
        "row": 45,
        "type": "parsing",
        "error": "Linha com menos de 4 colunas (encontradas: 2)"
      },
      {
        "row": 67,
        "qrCode": "QR456",
        "name": "Maria Santos",
        "type": "duplicate",
        "error": "Email duplicado encontrado para este evento"
      }
    ],
    "summary": {
      "success": 145,
      "skipped": 5,
      "duplicates": 1,
      "validationErrors": 3,
      "parseErrors": 1
    },
    "duration": 2345
  }
}
```

---

## 🔍 Próximos Passos Sugeridos

1. **Export de Logs** - Adicionar botão para exportar logs como CSV/JSON
2. **Filtros Avançados** - Filtrar logs por status, data, evento
3. **Notificações** - Email para admin quando importação falha
4. **Retry Automático** - Botão para tentar importar apenas as linhas que falharam
5. **Preview de Duplicatas** - Antes de inserir, mostrar possíveis duplicatas

---

**Data:** 2025-11-26
**Autor:** Claude Code Assistant
