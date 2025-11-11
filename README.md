# Sistema RSVP - Confirmação de Presença

Sistema completo de gerenciamento de RSVPs (confirmação de presença) construído com Next.js e Supabase.

## Funcionalidades

### Página Pública de Confirmação
- Identificação de convidados via GUID único na URL
- Interface amigável para confirmar ou recusar presença
- Mensagens de feedback em tempo real
- Design responsivo e moderno
- Tratamento de erros com mensagens amigáveis

### Painel Administrativo
- Autenticação por senha
- Visualização de todos os convidados
- Estatísticas em tempo real (confirmados, recusados, pendentes)
- Filtros por status (confirmado, recusado, pendente)
- Busca por nome de convidado
- Copiar link de convite individual
- Interface responsiva para desktop e mobile

## Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização moderna e responsiva
- **Supabase** - Banco de dados PostgreSQL e APIs
- **React Hooks** - Gerenciamento de estado (useState, useEffect)

## Estrutura do Projeto

```
invites/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Painel administrativo
│   ├── api/
│   │   └── rsvp/
│   │       ├── route.ts      # API GET/POST para RSVP
│   │       └── list/
│   │           └── route.ts  # API para listar convidados
│   ├── globals.css           # Estilos globais
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Página pública de confirmação
├── lib/
│   └── supabase.ts           # Cliente Supabase e tipos
├── supabase-schema.sql       # Schema do banco de dados
├── .env.local                # Variáveis de ambiente
└── package.json              # Dependências
```

## Configuração do Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. No SQL Editor do Supabase, execute o script `supabase-schema.sql`
4. Obtenha suas credenciais:
   - URL do projeto
   - Chave anon/public

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Admin Authentication
ADMIN_PASSWORD=sua_senha_admin
```

### 4. Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

O projeto estará disponível em `http://localhost:3000`

## Estrutura do Banco de Dados

### Tabela: `guests`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único do convidado |
| guid | UUID | Identificador único para link de convite |
| name | VARCHAR(255) | Nome do convidado |
| email | VARCHAR(255) | Email do convidado (opcional) |
| phone | VARCHAR(20) | Telefone sem máscara (formato: 5531999887766) |
| social_event | VARCHAR(255) | Nome do evento social (opcional) |
| status | VARCHAR(20) | Status: 'pending', 'confirmed', 'declined' |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

**Formato do Telefone:** Armazene apenas números, no formato internacional completo:
- Exemplo: `5531999887766` (Código do país + DDD + Número)
- O sistema formata automaticamente para exibição: `+55 (31) 99988-7766`

## APIs Disponíveis

### GET /api/rsvp?guid={guid}

Busca dados de um convidado pelo GUID.

**Resposta de Sucesso:**
```json
{
  "guest": {
    "id": 1,
    "guid": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "email": "joao.silva@email.com",
    "phone": "5531999887766",
    "social_event": "Festa de Confraternização 2024",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/rsvp

Atualiza o status de confirmação de um convidado.

**Corpo da Requisição:**
```json
{
  "guid": "123e4567-e89b-12d3-a456-426614174000",
  "status": "confirmed"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "guest": { ... },
  "message": "Presença confirmada com sucesso!"
}
```

### GET /api/rsvp/list

Lista todos os convidados (requer autenticação).

**Headers:**
```
x-admin-password: sua_senha_admin
```

**Query Parameters:**
- `status` (opcional): 'pending', 'confirmed', 'declined'
- `social_event` (opcional): filtrar por evento específico
- `search` (opcional): busca por nome

**Resposta de Sucesso:**
```json
{
  "guests": [...],
  "stats": {
    "total": 50,
    "confirmed": 30,
    "declined": 5,
    "pending": 15
  },
  "socialEvents": [
    "Festa de Confraternização 2024",
    "Workshop de Tecnologia"
  ]
}
```

## Como Usar

### Para Organizadores (Admin)

1. Acesse `/admin`
2. Digite a senha configurada em `ADMIN_PASSWORD`
3. Visualize todos os convidados e suas confirmações
4. Use os filtros para encontrar convidados específicos
5. Copie o link de convite individual para enviar aos convidados

### Para Convidados

1. Acesse o link recebido: `http://seu-site.com/?guid={guid-do-convidado}`
2. Visualize seu nome e informações do evento
3. Clique em "Confirmar Presença" ou "Recusar Presença"
4. Receba confirmação imediata da sua resposta
5. Você pode mudar sua resposta a qualquer momento

## Segurança

- **Row Level Security (RLS)** habilitado no Supabase
- Políticas de acesso configuradas para permitir:
  - Leitura pública (para verificar convites)
  - Atualização pública de status (apenas status RSVP)
  - Inserção apenas autenticada
- Autenticação simples por senha para área admin
- GUIDs únicos e não sequenciais para convites

## Customização

### Alterar Logo/Ícone

No arquivo `app/page.tsx`, linha ~88:
```tsx
<span className="text-3xl text-white font-bold">🎉</span>
```

Substitua o emoji ou adicione um componente `<Image>` do Next.js.

### Personalizar Cores

Edite `tailwind.config.ts` para adicionar suas cores personalizadas.

### Adicionar Campos Extras

1. Adicione colunas no `supabase-schema.sql`
2. Atualize a interface `Guest` em `lib/supabase.ts`
3. Modifique os formulários e APIs conforme necessário

## Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte seu repositório na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy automático!

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## Problemas Comuns

### Erro "Guest not found"

- Verifique se o GUID na URL está correto
- Certifique-se de que o convidado existe no banco de dados

### Erro 401 no Admin

- Verifique se a senha em `.env.local` está correta
- Limpe o sessionStorage e tente novamente

### Erro de conexão com Supabase

- Verifique as credenciais em `.env.local`
- Confirme que o projeto Supabase está ativo
- Verifique se as políticas RLS estão configuradas

## Suporte

Para problemas ou dúvidas:
1. Verifique a documentação do Next.js
2. Consulte a documentação do Supabase
3. Revise os logs de erro no console

## Licença

Este projeto é fornecido como exemplo educacional. Use e modifique conforme necessário.
