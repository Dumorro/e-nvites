# Guia Rápido de Configuração

Este guia vai te ajudar a configurar o sistema RSVP em poucos minutos.

## Passo 1: Instalar Dependências

```bash
npm install
```

## Passo 2: Configurar Supabase

### 2.1. Criar Conta e Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma nova organização (se não tiver)
4. Clique em "New Project"
5. Preencha:
   - **Name**: rsvp-system (ou qualquer nome)
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha a mais próxima
6. Clique em "Create new project"
7. Aguarde 1-2 minutos para o projeto ser criado

### 2.2. Executar Schema do Banco

1. No painel do Supabase, clique em "SQL Editor" no menu lateral
2. Clique em "New Query"
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor SQL
5. Clique em "Run" (ou pressione Ctrl+Enter)
6. Você deverá ver "Success. No rows returned"

### 2.3. Obter Credenciais

1. No painel do Supabase, clique em "Settings" (ícone de engrenagem)
2. Clique em "API" no menu lateral
3. Você verá duas informações importantes:
   - **Project URL**: algo como `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: uma string longa começando com `eyJ...`
4. Copie ambos (você vai usar no próximo passo)

## Passo 3: Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Substitua os valores:

```env
# Cole aqui a URL do seu projeto
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Cole aqui a chave anon/public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Crie uma senha para acessar a área admin
ADMIN_PASSWORD=sua_senha_segura_aqui
```

3. Salve o arquivo

## Passo 4: Executar o Projeto

```bash
npm run dev
```

O projeto estará rodando em `http://localhost:3000`

## Passo 5: Testar o Sistema

### Testar Página Pública (Convidado)

1. No Supabase, vá para "Table Editor" > "guests"
2. Você verá alguns convidados de exemplo
3. Clique em qualquer linha para ver os detalhes
4. Copie o valor do campo `guid`
5. Abra no navegador: `http://localhost:3000/?guid=SEU_GUID_AQUI`
6. Você verá a página de confirmação com o nome do convidado
7. Teste confirmar ou recusar presença

### Testar Área Admin

1. Acesse: `http://localhost:3000/admin`
2. Digite a senha que você configurou em `ADMIN_PASSWORD`
3. Você verá o painel com todos os convidados
4. Teste os filtros e busca
5. Clique em "Copiar Link" para obter o link de convite de qualquer convidado

## Passo 6: Adicionar Seus Próprios Convidados

### Opção A: Via Interface do Supabase

1. No Supabase, vá para "Table Editor" > "guests"
2. Clique em "Insert" > "Insert row"
3. Preencha apenas o campo "name" (exemplo: "Maria Silva")
4. O GUID será gerado automaticamente
5. Clique em "Save"

### Opção B: Via SQL

No SQL Editor do Supabase:

```sql
-- Inserir convidados com informações completas
INSERT INTO guests (name, email, phone, social_event) VALUES
  ('Carlos Santos', 'carlos@email.com', '5521987654321', 'Festa de Fim de Ano'),
  ('Ana Paula', 'ana@email.com', '5511976543210', 'Festa de Fim de Ano'),
  ('José Silva', 'jose@email.com', '5585965432109', 'Workshop Tech');

-- Ou apenas com nome (email, telefone e social_event são opcionais)
INSERT INTO guests (name) VALUES
  ('Maria Costa');
```

**Importante sobre telefone:** Use apenas números no formato internacional:
- Formato: Código país (55) + DDD (2 dígitos) + Número (9 dígitos)
- Exemplo: `5531999887766` será exibido como `+55 (31) 99988-7766`

## Próximos Passos

### Personalizar o Sistema

- **Logo**: Edite `app/page.tsx` linha ~88
- **Cores**: Modifique `tailwind.config.ts`
- **Textos**: Altere as mensagens nos componentes

### Deploy para Produção

1. Faça push do código para GitHub
2. Crie conta na [Vercel](https://vercel.com)
3. Importe seu repositório
4. Adicione as variáveis de ambiente
5. Deploy!

## Troubleshooting

### Erro "NEXT_PUBLIC_SUPABASE_URL is not defined"

- Certifique-se de que o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor (`npm run dev`)
- Verifique se as variáveis começam com `NEXT_PUBLIC_`

### Erro "Guest not found"

- Verifique se o GUID na URL está correto e completo
- Confirme que o convidado existe no banco de dados
- O GUID deve ser um UUID válido (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Erro 401 no Admin

- Verifique se a senha em `.env.local` está correta
- Limpe o cache do navegador (F5 + Ctrl)
- Tente em uma aba anônima

### Página em branco

- Abra o Console do navegador (F12)
- Verifique se há erros em vermelho
- Certifique-se de que todas as dependências foram instaladas (`npm install`)

## Precisa de Ajuda?

1. Revise este guia cuidadosamente
2. Confira o README.md para informações detalhadas
3. Verifique os logs no terminal onde está rodando `npm run dev`
4. Consulte a documentação:
   - [Next.js](https://nextjs.org/docs)
   - [Supabase](https://supabase.com/docs)

---

**Dica**: Marque este arquivo para referência rápida! 📚
