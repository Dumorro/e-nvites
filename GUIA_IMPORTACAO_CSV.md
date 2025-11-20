# Guia de Importação de Convidados via CSV

## Visão Geral

A funcionalidade de importação em lote permite adicionar múltiplos convidados a um evento através do upload de um arquivo CSV. O sistema valida os dados, gera GUIDs únicos automaticamente e fornece feedback detalhado sobre erros.

## Acesso

**URL:** `/admin/import-guests`

**Requisitos:**
- Estar autenticado no painel admin
- Ter um arquivo CSV no formato especificado

## Formato do CSV

### Estrutura

```csv
qrcode,nome,email,celular
ABC123,João Silva,joao.silva@example.com,5531999887766
DEF456,Maria Santos,maria.santos@example.com,5531988776655
GHI789,Pedro Oliveira,pedro.oliveira@example.com,5531977665544
```

### Campos

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `qrcode` | String | **Sim** | Código QR único para o convidado dentro do evento | `ABC123` |
| `nome` | String | **Sim** | Nome completo do convidado | `João Silva` |
| `email` | String | Não | Email do convidado (convertido para lowercase) | `joao@example.com` |
| `celular` | String | Não | Telefone apenas com números (sem formatação) | `5531999887766` |

### Regras de Validação

✅ **QR Code:**
- Obrigatório
- Deve ser único dentro do mesmo evento (constraint no banco)
- Pode conter letras, números e caracteres especiais

✅ **Nome:**
- Obrigatório
- Texto livre

✅ **Email:**
- Opcional
- Será convertido automaticamente para lowercase
- Se fornecido, deve ser um email válido

✅ **Celular:**
- Opcional
- Apenas números serão armazenados (formatação removida automaticamente)
- Formato recomendado: `5531999887766` (código país + DDD + número)

## Processo de Importação

### Passo 1: Selecionar Evento
Escolha o evento para o qual deseja importar convidados:
- Rio de Janeiro (ID 1)
- São Paulo (ID 2)
- Festa de Fim de Ano (ID 7)

### Passo 2: Upload do Arquivo
1. Clique na área de upload ou arraste o arquivo CSV
2. Aguarde a prévia das primeiras 5 linhas
3. Verifique se os dados estão corretos

### Passo 3: Validação Automática
O sistema valida:
- Formato do CSV (deve ter 4 colunas)
- Campos obrigatórios (qrcode e nome)
- Estrutura das linhas

### Passo 4: Importação
1. Clique em "Importar Convidados"
2. Aguarde o processamento (spinner será exibido)
3. Veja as estatísticas da importação

### Passo 5: Verificar Resultados
Após a importação, você verá:
- **Total de linhas processadas**
- **Convidados inseridos com sucesso**
- **Número de erros encontrados**

## Download Automático de Log de Erros

### Quando acontece?
Se houver **qualquer erro** durante a importação, um arquivo de log será **baixado automaticamente** com os detalhes.

### Formato do Log

```
================================================================================
LOG DE ERROS - IMPORTAÇÃO DE CONVIDADOS
================================================================================

Data/Hora: 20/01/2025, 14:30:45
Evento: Rio de Janeiro (oil-celebration-rj)
Arquivo: convidados-rj.csv

--------------------------------------------------------------------------------
RESUMO
--------------------------------------------------------------------------------
Total de linhas processadas: 15
Convidados inseridos: 12
Erros encontrados: 3

--------------------------------------------------------------------------------
DETALHES DOS ERROS
--------------------------------------------------------------------------------

Linha 5: Linha com menos de 4 colunas (encontradas: 3)
Linha 8: QR Code e Nome são obrigatórios
Linha 12: QR Code duplicado encontrado para este evento

================================================================================
FIM DO LOG
================================================================================
```

### Download Manual
Você também pode baixar o log manualmente clicando no botão **"📥 Baixar Log de Erros"** na seção de estatísticas.

## Erros Comuns

### 1. QR Code Duplicado
```
Erro: QR Code duplicado encontrado para este evento
```
**Causa:** Tentativa de inserir um QR code que já existe para o mesmo evento.

**Solução:**
- Verifique o CSV e remova duplicatas
- Use QR codes únicos para cada convidado

### 2. Campos Obrigatórios Faltando
```
Erro: QR Code e Nome são obrigatórios
```
**Causa:** Linha do CSV sem qrcode ou nome.

**Solução:**
- Preencha todos os campos obrigatórios
- Remova linhas vazias do CSV

### 3. Número de Colunas Incorreto
```
Erro: Linha com menos de 4 colunas (encontradas: 2)
```
**Causa:** Linha do CSV mal formatada.

**Solução:**
- Verifique se todas as linhas têm 4 colunas separadas por vírgulas
- Coloque valores vazios entre vírgulas para campos opcionais: `ABC123,João Silva,,`

### 4. Valores com Vírgulas
Se o nome ou email contiver vírgulas, use aspas:
```csv
qrcode,nome,email,celular
ABC123,"Silva, João",joao@example.com,5531999887766
```

## Comportamento Pós-Importação

### Dados Gerados Automaticamente
- **GUID:** UUID único gerado para cada convidado
- **Status:** Definido como `pending` (aguardando confirmação)
- **Email:** Convertido para lowercase
- **Celular:** Apenas dígitos armazenados

### Exemplo de Registro Criado
```json
{
  "id": 123,
  "qr_code": "ABC123",
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "phone": "5531999887766",
  "guid": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": 1,
  "status": "pending",
  "created_at": "2025-01-20T14:30:45Z"
}
```

## Boas Práticas

### ✅ Recomendado
- Validar o CSV localmente antes do upload
- Usar um editor de planilhas (Excel, Google Sheets) para criar o CSV
- Salvar como "CSV UTF-8" para preservar caracteres especiais
- Fazer backup dos dados antes de importações grandes
- Testar com um CSV pequeno (5-10 linhas) primeiro

### ❌ Evitar
- Criar CSV manualmente em editores de texto (risco de formatação incorreta)
- Usar caracteres especiais em QR codes (mantenha simples: A-Z, 0-9)
- Importar sem verificar a prévia
- Importar o mesmo arquivo duas vezes (causará duplicatas)

## Limitações

- **Tamanho máximo do arquivo:** Limitado pela configuração do servidor (geralmente 5-10MB)
- **Número de linhas:** Recomendado até 1000 linhas por importação
- **Timeout:** Importações muito grandes podem exceder o timeout (2 minutos)

Para importações maiores, divida o CSV em múltiplos arquivos menores.

## Performance

### Otimização de Bulk Insert
O sistema usa **bulk insert** para melhor performance:
- 100 convidados: ~0.5 segundos
- 500 convidados: ~2 segundos
- 1000 convidados: ~4 segundos

## Troubleshooting

### O arquivo não está sendo aceito
- Verifique se a extensão é `.csv`
- Tente salvar o arquivo novamente como CSV UTF-8

### A importação falha sem erro específico
- Verifique os logs do console do navegador (F12)
- Verifique se você está autenticado
- Tente com um arquivo menor primeiro

### QR codes não aparecem únicos
- Aplique a migration [`add_unique_qr_code_event.sql`](migrations/add_unique_qr_code_event.sql)
- Veja o guia completo em [`GUIA_UNIQUE_CONSTRAINT.md`](GUIA_UNIQUE_CONSTRAINT.md)

## Arquivos de Exemplo

- **CSV válido:** [`exemplo-importacao-convidados.csv`](public/exemplo-importacao-convidados.csv)
- **Log de erros:** [`exemplo-log-erros.txt`](public/exemplo-log-erros.txt)

## Verificação Pós-Importação

Após importar, verifique os dados no painel admin:

1. Acesse `/admin`
2. Filtre pelo evento importado
3. Verifique o número total de convidados
4. Confirme que os QR codes estão corretos
5. Teste o link de convite de pelo menos um convidado

## Rollback

Se precisar desfazer uma importação:

```sql
-- Deletar convidados importados recentemente (últimos 5 minutos)
DELETE FROM guests
WHERE event_id = 1
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Ou deletar por QR codes específicos
DELETE FROM guests
WHERE event_id = 1
  AND qr_code IN ('ABC123', 'DEF456', 'GHI789');
```

⚠️ **Atenção:** Não há undo automático. Faça backup antes de deletar!

## FAQ

### Posso usar o mesmo QR code em eventos diferentes?
Sim! A constraint única é `(qr_code, event_id)`, permitindo QR codes duplicados entre eventos diferentes.

### O que acontece se eu importar o mesmo CSV duas vezes?
A segunda importação falhará com erro de "QR Code duplicado" para todos os registros.

### Posso editar os dados após a importação?
Sim, você pode editar manualmente no Supabase Table Editor ou via painel admin.

### O email é validado?
Atualmente não há validação rigorosa de formato de email. O sistema apenas converte para lowercase.

### Os celulares precisam ter 11 dígitos?
Não há validação de tamanho. Qualquer sequência de dígitos é aceita.

## Logs e Monitoramento

Os logs da API podem ser visualizados para debug:
```bash
# Buscar logs de importação
grep "Import Guests" /var/log/app.log

# Ver estatísticas
grep "Successfully inserted" /var/log/app.log
```

## Suporte

Em caso de problemas:
1. Verifique o log de erros baixado automaticamente
2. Consulte a seção de Erros Comuns acima
3. Verifique os logs do navegador (Console do DevTools)
4. Entre em contato com o suporte técnico
