# Guia: Como Organizar os PDFs dos Convites

Este guia explica passo a passo como configurar os PDFs dos convites para download.

## 📋 Pré-requisitos

1. Banco de dados com a coluna `qr_code` adicionada
2. PDFs dos convites já gerados (ou prontos para gerar)

## 🚀 Passo a Passo

### 1️⃣ Verificar Status Atual

Execute o comando para ver quais convidados precisam de QR code e quais PDFs estão faltando:

```bash
npm run check-pdfs
```

Isso mostrará:
- Total de convidados por evento
- Convidados sem QR code
- PDFs encontrados vs. PDFs faltando
- Localização exata onde cada PDF deve estar

### 2️⃣ Gerar QR Codes (se necessário)

Se alguns convidados não têm QR code, você pode gerá-los automaticamente:

**Opção A: Usar o GUID como QR code** (recomendado se não houver PDFs ainda)
```bash
npm run generate-qr-codes
```

**Opção B: Gerar códigos sequenciais** (ex: 90001, 90002, etc.)
```bash
npm run generate-qr-codes:sequential
```

### 3️⃣ Organizar os PDFs

Depois de gerar ou ter os QR codes, coloque os PDFs nas pastas corretas:

```
public/
└── events/
    ├── rio/          # PDFs para evento do Rio
    │   ├── 90001.pdf
    │   ├── 90002.pdf
    │   └── ...
    └── saopaulo/     # PDFs para evento de São Paulo
        ├── 90003.pdf
        ├── 90004.pdf
        └── ...
```

**IMPORTANTE:** O nome do arquivo deve ser EXATAMENTE o `qr_code` do convidado + `.pdf`

### 4️⃣ Verificar Novamente

Execute novamente para confirmar que todos os PDFs estão no lugar:

```bash
npm run check-pdfs
```

Se tudo estiver correto, você verá: ✅ "Todos os PDFs estão presentes!"

## 📊 Exemplo de Saída do Script

```
🔍 Verificando PDFs dos convidados...

📊 Total de convidados: 150

🏖️  EVENTO RIO DE JANEIRO
============================================================
📁 Total de PDFs na pasta: 75
👥 Total de convidados: 80

✅ PDFs encontrados: 75/80

❌ PDFs FALTANDO (5):
   - 90001.pdf para João Silva (ID: 1)
     Deve estar em: public/events/rio/90001.pdf
   - 90002.pdf para Maria Santos (ID: 2)
     Deve estar em: public/events/rio/90002.pdf
   ...
```

## 🔧 Troubleshooting

### Problema: "Convite não encontrado" ao clicar no botão

**Causas possíveis:**
1. O arquivo PDF não existe na pasta correta
2. O nome do arquivo não corresponde ao `qr_code` do banco
3. A extensão está errada (deve ser `.pdf` minúsculo)

**Solução:**
1. Abra o DevTools do navegador (F12)
2. Vá na aba Console
3. Procure por: `PDF not found: /events/rio/XXXXX.pdf`
4. Verifique se o arquivo existe exatamente com esse nome

### Problema: "Código QR não disponível"

**Causa:** O campo `qr_code` está NULL no banco de dados

**Solução:**
```bash
npm run generate-qr-codes
```

### Problema: PDFs com nomes diferentes

Se você já tem PDFs com outros nomes, você tem duas opções:

**Opção A: Renomear os PDFs** (recomendado)
- Execute `npm run check-pdfs` para ver quais QR codes espera
- Renomeie seus PDFs para corresponder

**Opção B: Atualizar QR codes no banco**
```sql
-- Atualizar para corresponder aos nomes dos PDFs
UPDATE guests SET qr_code = 'nome-do-seu-pdf' WHERE id = 1;
```

## 📝 Comandos Úteis

```bash
# Verificar status dos PDFs
npm run check-pdfs

# Gerar QR codes usando GUID
npm run generate-qr-codes

# Gerar QR codes sequenciais
npm run generate-qr-codes:sequential

# Listar PDFs nas pastas
dir public\events\rio\*.pdf
dir public\events\saopaulo\*.pdf
```

## ✅ Checklist Final

Antes de liberar para produção, verifique:

- [ ] Todos os convidados têm QR code no banco
- [ ] Todos os PDFs estão nas pastas corretas
- [ ] Os nomes dos arquivos correspondem aos QR codes
- [ ] Testou o download com pelo menos um convidado
- [ ] A mensagem de erro aparece para convidados sem PDF
