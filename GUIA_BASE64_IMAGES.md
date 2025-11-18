# Guia de Armazenamento de Imagens em Base64

## Visão Geral

Este sistema armazena imagens de convites no banco de dados em formato base64 para resolver limitações de sistemas serverless (como Vercel), onde o filesystem é somente leitura (exceto `/tmp`).

## Arquitetura

### Banco de Dados

**Tabela:** `guests`
**Nova Coluna:** `invite_image_base64` (TEXT, nullable)
**Formato:** Data URI completo (exemplo: `data:image/png;base64,iVBORw0KGgo...`)

### Fluxo de Upload

1. Admin acessa `/admin/upload-invites`
2. Seleciona evento e arquivo ZIP com imagens
3. Sistema extrai ZIP na memória (não no disco)
4. Para cada imagem:
   - Extrai QR code do nome do arquivo (formato: `{qr_code}-{event-slug}.{ext}`)
   - Busca convidado no banco por QR code e event_id
   - Converte imagem para base64 data URI
   - Salva na coluna `invite_image_base64`

### Fluxo de Envio de Email

1. Sistema prepara email de confirmação
2. Verifica se convidado tem `invite_image_base64` no banco
3. Se sim: converte base64 para buffer e anexa ao email
4. Se não: fallback para filesystem (backward compatibility)

### Fluxo de Download

1. Usuário clica em "Acessar meu convite" na página de confirmação
2. Frontend chama API `/api/rsvp/guest-image?qrCode={code}&eventId={id}`
3. API verifica banco de dados primeiro
4. Se encontrado: retorna data URI base64
5. Se não: verifica filesystem (backward compatibility)
6. Frontend cria link de download usando data URI

## Endpoints API

### POST /api/admin/upload-invites-db

Upload de ZIP com imagens para armazenar no banco.

**Headers:**
- `x-admin-password`: Senha de administrador

**Body (FormData):**
- `file`: Arquivo ZIP
- `eventId`: ID do evento (1, 2, ou 7)

**Resposta:**
```json
{
  "success": true,
  "message": "Upload realizado com sucesso",
  "stats": {
    "total": 150,
    "updated": 145,
    "notFound": 5,
    "files": ["3001-festa-equinor.jpg", ...],
    "notFoundFiles": ["9999-festa-equinor.jpg", ...]
  }
}
```

### GET /api/rsvp/guest-image

Busca imagem do convite (banco ou filesystem).

**Query Params:**
- `qrCode`: Código QR do convidado
- `eventId`: ID do evento

**Resposta:**
```json
{
  "success": true,
  "source": "database",
  "imageData": "data:image/png;base64,iVBORw0KGgo..."
}
```

## Nomenclatura de Arquivos

Os arquivos no ZIP devem seguir o padrão:

```
{qr_code}-{event-slug}.{ext}
```

**Exemplos:**
- `3001-festa-equinor.png`
- `3002-festa-equinor.jpg`
- `1234-oil-celebration-rj.jpg`
- `5678-oil-celebration-sp.jpg`

**Event Slugs:**
- Event ID 1: `oil-celebration-rj`
- Event ID 2: `oil-celebration-sp`
- Event ID 7: `festa-equinor`

## Formatos Suportados

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- GIF (`.gif`)
- WebP (`.webp`)

## Limitações

### Tamanho de Imagens

PostgreSQL (Supabase) suporta TEXT fields de até **1 GB**. Em base64, o tamanho aumenta aproximadamente 33%.

**Recomendações:**
- Imagens individuais: até 5 MB (antes da conversão)
- Após conversão base64: ~6.65 MB por imagem
- Total: até 1 GB por campo

### Performance

Base64 é ~33% maior que binário. Para grandes volumes:
- Considere otimizar imagens antes do upload (compressão)
- Use formatos eficientes (JPEG para fotos, PNG para gráficos)

## Backward Compatibility

O sistema mantém compatibilidade com imagens existentes no filesystem:

1. **Email:** Verifica banco primeiro, depois filesystem
2. **Download:** API verifica banco primeiro, depois filesystem
3. **Migração:** Imagens antigas continuam funcionando sem alteração

## Migração de Dados

Para migrar imagens existentes do filesystem para o banco:

```sql
-- Script manual (executar via Supabase SQL Editor)
-- Substitua com lógica adequada para converter arquivos

UPDATE guests
SET invite_image_base64 = 'data:image/jpeg;base64,...'
WHERE qr_code = '3001' AND event_id = 7;
```

**Nota:** É recomendado fazer um novo upload via interface admin em vez de migração manual.

## Troubleshooting

### Imagem não encontrada no upload

**Possíveis causas:**
- Nome do arquivo não segue o padrão `{qr_code}-{event-slug}.{ext}`
- QR code não existe no banco para o evento especificado
- Event ID incorreto

**Solução:**
- Verificar nomes dos arquivos no ZIP
- Confirmar que convidados existem no banco com os QR codes corretos

### Imagem não anexada ao email

**Possíveis causas:**
- `invite_image_base64` é NULL no banco
- Data URI inválido ou corrompido

**Solução:**
- Verificar coluna `invite_image_base64` no Supabase
- Re-fazer upload se necessário

### Download não funciona

**Possíveis causas:**
- API `/api/rsvp/guest-image` retornando erro
- Data URI inválido

**Solução:**
- Verificar logs da API no Vercel
- Testar endpoint manualmente: `/api/rsvp/guest-image?qrCode=3001&eventId=7`

## Vantagens

✅ Funciona em ambientes serverless (Vercel, AWS Lambda, etc.)
✅ Não depende de filesystem
✅ Backup automático via backup do banco
✅ Replicação automática (se banco for replicado)
✅ Versionamento via banco de dados

## Desvantagens

⚠️ Tamanho 33% maior (base64 vs binário)
⚠️ Carga no banco de dados
⚠️ Não há CDN nativo (mas Vercel faz cache da API)

## Conclusão

O armazenamento em base64 é a solução ideal para ambientes serverless, sacrificando um pouco de eficiência de armazenamento em troca de simplicidade e compatibilidade total com plataformas como Vercel.
