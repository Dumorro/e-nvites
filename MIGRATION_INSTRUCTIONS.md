# Instruções de Migração - Sistema de Eventos

## Passo 1: Executar SQL no Supabase

1. Acesse o Supabase SQL Editor em: https://hrucovxpenekzmxbatww.supabase.co
2. Execute o arquivo `supabase-schema.sql` atualizado
3. Verifique se as tabelas `events` e `guests` foram criadas/atualizadas corretamente

## Passo 2: Verificar Migração

Após executar o SQL, verifique:

```sql
-- Verificar tabela events
SELECT * FROM events;

-- Verificar se guests tem event_id
SELECT id, name, social_event, event_id FROM guests LIMIT 5;

-- Verificar relacionamento
SELECT g.name, g.status, e.name as event_name, e.template_name
FROM guests g
LEFT JOIN events e ON g.event_id = e.id
LIMIT 10;
```

## Passo 3: Próximas Implementações

Agora que o banco de dados está pronto, você pode prosseguir com:

### 3.1 Atualizar tipos TypeScript
Substitua o conteúdo de `lib/supabase.ts` pelo seguinte:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Event {
  id: number
  name: string
  slug: string
  description: string | null
  event_date: string | null
  location: string | null

  // Template customization
  template_name: string
  primary_color: string
  secondary_color: string
  background_style: string
  logo_url: string | null
  banner_image_url: string | null

  // Custom content
  welcome_message: string
  event_details: string | null
  show_qr_code: boolean
  show_event_details: boolean

  // Status
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Guest {
  id: number
  guid: string
  name: string
  email: string | null
  phone: string | null
  social_event: string | null
  event_id: number | null
  status: 'pending' | 'confirmed' | 'declined'
  created_at: string
  updated_at: string
}

export interface GuestWithEvent extends Guest {
  event?: Event | null
}
```

### 3.2 Criar API de Eventos
Execute o comando:
```bash
mkdir -p app/api/events
```

### 3.3 Implementar Templates Dinâmicos
Os templates HTML existentes (`equinor-convite-RJ.html` e `equinor-convite-SP.html`) serão usados como base.

## Estrutura Final

```
e-nvites/
├── supabase-schema.sql (✅ Atualizado)
├── lib/
│   └── supabase.ts (⏳ Pendente - atualizar tipos)
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.ts (⏳ Criar)
│   │   │   └── [id]/
│   │   │       └── route.ts (⏳ Criar)
│   │   └── rsvp/
│   │       ├── route.ts (⏳ Atualizar)
│   │       └── list/
│   │           └── route.ts (⏳ Atualizar)
│   ├── page.tsx (⏳ Refatorar)
│   └── admin/
│       ├── page.tsx (⏳ Atualizar)
│       └── events/
│           ├── page.tsx (⏳ Criar)
│           └── [id]/
│               └── edit/
│                   └── page.tsx (⏳ Criar)
├── components/
│   └── templates/
│       ├── types.ts (⏳ Criar)
│       ├── TemplateDefault.tsx (⏳ Criar)
│       └── TemplateFactory.tsx (⏳ Criar)
└── templates/
    ├── equinor-convite-RJ.html (✅ Existe)
    └── equinor-convite-SP.html (✅ Existe)
```

## Resumo do Plano

### ✅ Concluído
1. Schema SQL para tabela `events`
2. Migração para adicionar `event_id` em `guests`
3. Relacionamento entre `guests` e `events`
4. Dados de exemplo com eventos RJ e SP

### ⏳ Próximos Passos
1. Atualizar `lib/supabase.ts` com novos tipos
2. Criar APIs CRUD para eventos
3. Atualizar APIs de RSVP para incluir dados do evento
4. Criar componentes de template React
5. Refatorar página de convite para usar templates dinâmicos
6. **Mover botões para dentro do card** (substituir área do QR code)
7. Criar painel admin para gerenciar eventos
8. Criar editor de templates no admin

## Observações Importantes

- Os templates HTML existentes (`equinor-convite-RJ.html` e `equinor-convite-SP.html`) são muito grandes (670KB cada)
- Eles foram gerados a partir de PDFs e contêm muitos estilos inline
- **Recomendação**: Criar componentes React limpos inspirados nesses templates, ao invés de tentar convertê-los diretamente
- Os botões de confirmação/recusa devem substituir a área do QR code conforme a imagem fornecida

## Deseja Continuar?

Para continuar a implementação, peça para:
1. "Atualizar lib/supabase.ts"
2. "Criar API de eventos"
3. "Refatorar página de convite"
4. Ou qualquer outra tarefa específica da lista acima
