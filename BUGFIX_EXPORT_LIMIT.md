# Correção: Bug de Limitação na Exportação CSV

## 🐛 Problema Identificado

A exportação CSV no painel Admin estava limitada a **1000 registros**, mesmo quando haviam mais convidados no banco de dados. Isso ocorria porque a API `/api/rsvp/list` tinha um limite de segurança hardcoded.

### Causa Raiz

**Arquivo:** `app/api/rsvp/list/route.ts` (linha 84)

```typescript
let query = supabase
  .from('guests')
  .select('...')
  .order('created_at', { ascending: false })
  .limit(1000) // ❌ Limite fixo aplicado sempre
```

O limite de 1000 registros era aplicado em **todos os casos**, incluindo durante a exportação CSV, resultando em exportações incompletas para eventos com mais de 1000 convidados.

---

## ✅ Solução Implementada

### 1. **Modo de Exportação na API**

Adicionado parâmetro `export=true` para sinalizar que a requisição é uma exportação e não deve ter limite.

**Arquivo:** `app/api/rsvp/list/route.ts`

```typescript
const exportMode = searchParams.get('export') === 'true'

// Apply limit only if NOT in export mode
if (!exportMode) {
  query = query.limit(1000) // Safety limit for regular display
  console.log('📋 [Query Mode] Regular mode - applying 1000 limit')
} else {
  console.log('📋 [Query Mode] Export mode - no limit applied')
}
```

### 2. **Função de Exportação Atualizada**

A função `exportToCSV` no Admin agora faz uma requisição **separada** para buscar **todos** os registros.

**Arquivo:** `app/admin/page.tsx`

```typescript
const exportToCSV = async () => {
  try {
    setExporting(true)

    // Fetch ALL guests with export=true parameter
    const params = new URLSearchParams()
    params.append('export', 'true') // 🔑 Remove limit

    // Add filters
    if (statusFilter !== 'all') params.append('status', statusFilter)
    if (eventIdFilter !== 'all') params.append('event_id', eventIdFilter)
    if (searchQuery) params.append('search', searchQuery)

    const response = await fetch(`/api/rsvp/list?${params}`, {
      headers: { 'x-admin-password': password }
    })

    const data = await response.json()
    const allGuests = data.guests // ✅ Todos os registros

    // Generate CSV...
  } finally {
    setExporting(false)
  }
}
```

### 3. **Indicador Visual de Carregamento**

Adicionado estado `exporting` e feedback visual durante a exportação:

```typescript
const [exporting, setExporting] = useState(false)

// No botão:
<button
  onClick={exportToCSV}
  disabled={guests.length === 0 || exporting}
>
  {exporting ? (
    <>
      <span className="animate-spin">⏳</span>
      <span>Exportando...</span>
    </>
  ) : (
    <>
      <span>📥</span>
      <span>Exportar CSV</span>
    </>
  )}
</button>
```

---

## 🎯 Benefícios

1. **Exportação Completa**
   - ✅ Todos os registros são exportados (sem limite de 1000)
   - ✅ Mantém filtros aplicados (status, evento, busca)

2. **Segurança Mantida**
   - ✅ Visualização normal ainda tem limite de 1000 (previne queries massivas desnecessárias)
   - ✅ Exportação requer autenticação (header `x-admin-password`)

3. **UX Melhorada**
   - ✅ Indicador visual durante exportação
   - ✅ Botão desabilitado durante o processo
   - ✅ Logs no console para debugging

4. **Retrocompatibilidade**
   - ✅ Funcionamento normal não foi alterado
   - ✅ Apenas exportações usam o novo modo

---

## 📊 Comparação: Antes vs Depois

### Antes (Bug)
```
Evento com 2500 convidados
├─ Visualização no Admin: 1000 registros (paginados)
└─ Exportação CSV: ❌ 1000 registros (limitado)
```

### Depois (Corrigido)
```
Evento com 2500 convidados
├─ Visualização no Admin: 1000 registros (paginados)
└─ Exportação CSV: ✅ 2500 registros (completo)
```

---

## 🔍 Logs de Debug

A API agora registra logs detalhados para facilitar o debugging:

```bash
# Modo normal (visualização)
📋 [Query Mode] Regular mode - applying 1000 limit

# Modo exportação
📋 [Query Mode] Export mode - no limit applied
📥 [Export] Fetching all guests for CSV export...
📥 [Export] Fetched 2500 guests for export
✅ [Export] CSV generated successfully: convidados_2025-12-01.csv
```

---

## 🧪 Como Testar

1. **Criar evento com mais de 1000 convidados**
   ```bash
   # Importar CSV com 1500+ registros
   npm run import-guests
   ```

2. **Acessar Admin e verificar**
   - Visualização mostra paginação (máximo 1000 por página)
   - Exportar CSV deve conter **todos** os registros

3. **Verificar logs no console do navegador**
   ```
   📥 [Export] Fetched 1500 guests for export
   ✅ [Export] CSV generated successfully
   ```

4. **Abrir CSV e contar linhas**
   ```bash
   # Linux/Mac
   wc -l convidados_*.csv

   # Windows PowerShell
   (Get-Content convidados_*.csv).Count
   ```

---

## 📝 Arquivos Modificados

- [app/api/rsvp/list/route.ts](app/api/rsvp/list/route.ts) - API com modo de exportação
- [app/admin/page.tsx](app/admin/page.tsx) - Função de exportação atualizada

---

## ⚠️ Considerações de Performance

Para eventos **muito grandes** (10k+ convidados):

1. **Timeout do Vercel:** Limite de 10s na execução serverless
   - Solução: Considerar paginação na exportação ou worker background

2. **Memória do Navegador:** CSVs grandes podem consumir muita RAM
   - Solução: Stream processing ou download direto do servidor

3. **Tempo de Resposta:** Consultas grandes podem demorar
   - Solução atual: Indicador de loading para feedback ao usuário

---

**Data:** 2025-12-01
**Versão:** 1.1.0
**Status:** ✅ Corrigido e Testado
