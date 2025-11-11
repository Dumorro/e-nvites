# Identidade Visual Equinor Marina

Este documento descreve a identidade visual aplicada ao sistema RSVP baseada no Equinor Marina.

## Paleta de Cores

### Cores Principais
- **Equinor Red** (#ED1C24): Cor primária da marca, usada para CTAs e destaques
- **Equinor Navy** (#002855): Cor secundária, usada para textos e elementos de navegação
- **Equinor Blue** (#0084C9): Cor de apoio, usada para status pendentes e elementos informativos

### Cores de Apoio
- **Orange** (#FF6B35): Background gradiente
- **Pink** (#E91E63): Background gradiente
- **Cyan** (#00BCD4): Background gradiente e detalhes

## Tipografia

- **Fonte**: System fonts (system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif)
- **Estilo**: Moderna, limpa e altamente legível

## Logotipo

### Localização
- Logo horizontal: `/public/images/equinor-logo.png`
- Logo vertical: `/public/images/equinor-logo-vert.png`

### Uso
```tsx
<Image
  src="/images/equinor-logo.png"
  alt="Equinor"
  width={200}
  height={80}
  className="mx-auto"
  priority
/>
```

## Componentes Estilizados

### Botões
- **Primário**: Vermelho Equinor (#ED1C24) com hover escuro
- **Secundário**: Azul Navy (#002855) com hover escuro
- **Outline**: Borda cinza com hover suave

### Cards
- Fundo branco com sombra suave
- Bordas arredondadas (rounded-xl)
- Border lateral colorido para categorização

### Badges de Status
- **Confirmado**: Vermelho Equinor
- **Recusado**: Cinza
- **Pendente**: Azul Equinor

## Background

### Página Pública
```css
bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600
```

### Efeitos de Profundidade
- Círculos animados com blur
- Mix-blend-multiply para texturas sobrepostas
- Animação pulse para movimento suave

### Painel Admin
- Background: Cinza claro (#F9FAFB)
- Header: Gradiente vermelho para azul navy

## Aplicação das Cores

### Tailwind Config
As cores estão definidas em `tailwind.config.ts`:

```typescript
equinor: {
  red: '#ED1C24',
  navy: '#002855',
  blue: '#0084C9',
  orange: '#FF6B35',
  pink: '#E91E63',
  cyan: '#00BCD4',
}
```

### CSS Variables
Definidas em `app/globals.css`:

```css
:root {
  --equinor-red: #ED1C24;
  --equinor-navy: #002855;
  --equinor-blue: #0084C9;
}
```

## Diretrizes de Uso

### DO ✅
- Use o vermelho Equinor para ações primárias
- Use o navy para textos e cabeçalhos
- Mantenha alto contraste para acessibilidade
- Use o gradiente colorido apenas em fundos
- Mantenha espaçamento generoso

### DON'T ❌
- Não use o vermelho para textos longos
- Não misture muitas cores em um único elemento
- Não reduza o contraste abaixo de 4.5:1
- Não use o logo em fundos coloridos sem contraste
- Não altere as proporções do logo

## Responsividade

Todos os componentes são responsivos e adaptam-se a:
- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+

## Acessibilidade

- Contraste WCAG AA mínimo: 4.5:1
- Todos os elementos interativos têm estados de foco visíveis
- Textos com tamanho mínimo de 16px
- Botões com área de toque mínima de 44x44px

## Manutenção

Para atualizar a identidade visual:

1. **Cores**: Edite `tailwind.config.ts` e `app/globals.css`
2. **Logo**: Substitua os arquivos em `/public/images/`
3. **Componentes**: Atualize as classes utility em `app/globals.css`

---

**Versão**: 1.0
**Última atualização**: 2025-01-11
