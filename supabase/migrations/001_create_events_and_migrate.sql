-- ==============================================================
-- MIGRATION FIX: Adicionar event_id à tabela guests existente
-- Execute este SQL no Supabase SQL Editor
-- ==============================================================

-- 1. Criar função de atualização (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- 2. Criar tabela events
-- ==============================================================

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  location VARCHAR(500),

  -- Template customization
  template_name VARCHAR(100) DEFAULT 'equinor-default',
  primary_color VARCHAR(7) DEFAULT '#FF1243',
  secondary_color VARCHAR(7) DEFAULT '#243746',
  background_style VARCHAR(50) DEFAULT 'gradient',
  logo_url TEXT,
  banner_image_url TEXT,

  -- Custom content
  welcome_message TEXT DEFAULT 'Você foi convidado!',
  event_details TEXT,
  show_qr_code BOOLEAN DEFAULT false,
  show_event_details BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices na tabela events
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- Criar trigger para events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- 3. Adicionar coluna event_id à tabela guests
-- ==============================================================

-- Adicionar coluna event_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE guests ADD COLUMN event_id BIGINT;
  END IF;
END $$;

-- Criar índice para event_id
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);

-- Adicionar foreign key constraint (removendo primeiro se já existir)
DO $$
BEGIN
  -- Tentar remover constraint existente
  ALTER TABLE guests DROP CONSTRAINT IF EXISTS fk_guests_events;

  -- Adicionar a constraint
  ALTER TABLE guests ADD CONSTRAINT fk_guests_events
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignora erro se já existir
    NULL;
END $$;

-- ==============================================================
-- 4. Configurar RLS para events
-- ==============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow public read access on events" ON events;
DROP POLICY IF EXISTS "Allow admin access on events" ON events;

-- Criar políticas para events
CREATE POLICY "Allow public read access on events" ON events
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin access on events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==============================================================
-- 5. Inserir eventos de exemplo
-- ==============================================================

INSERT INTO events (name, slug, description, event_date, location, template_name, show_qr_code, show_event_details) VALUES
  (
    'Festa de Confraternização RJ 2024',
    'festa-confraternizacao-rj-2024',
    'Festa de fim de ano da Equinor no Rio de Janeiro',
    '2024-12-20 19:00:00-03',
    'Rio de Janeiro',
    'equinor-convite-RJ',
    true,
    true
  ),
  (
    'Festa de Confraternização SP 2024',
    'festa-confraternizacao-sp-2024',
    'Festa de fim de ano da Equinor em São Paulo',
    '2024-12-22 19:00:00-03',
    'São Paulo',
    'equinor-convite-SP',
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  event_date = EXCLUDED.event_date,
  location = EXCLUDED.location,
  template_name = EXCLUDED.template_name,
  show_qr_code = EXCLUDED.show_qr_code,
  show_event_details = EXCLUDED.show_event_details,
  updated_at = NOW();

-- ==============================================================
-- 6. Migrar dados: Criar eventos de social_event existentes
-- ==============================================================

-- Criar eventos a partir dos social_event existentes
INSERT INTO events (name, slug, is_active, description)
SELECT DISTINCT
  social_event,
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(social_event, ' ', '-'),
            'ã', 'a'
          ),
          'ç', 'c'
        ),
        'õ', 'o'
      ),
      'á', 'a'
    )
  ),
  true,
  'Evento migrado automaticamente'
FROM guests
WHERE social_event IS NOT NULL
  AND social_event <> ''
  AND social_event NOT IN (SELECT name FROM events)
ON CONFLICT (name) DO NOTHING;

-- ==============================================================
-- 7. Vincular convidados aos eventos
-- ==============================================================

-- Atualizar event_id nos convidados baseado no social_event
UPDATE guests
SET event_id = events.id
FROM events
WHERE guests.social_event = events.name
  AND guests.event_id IS NULL;

-- ==============================================================
-- 8. Verificação
-- ==============================================================

-- Verificar eventos criados
SELECT
  id,
  name,
  slug,
  template_name,
  location,
  event_date,
  is_active
FROM events
ORDER BY created_at DESC;

-- Verificar convidados vinculados
SELECT
  COUNT(*) as total_guests,
  COUNT(event_id) as guests_with_event,
  COUNT(*) - COUNT(event_id) as guests_without_event
FROM guests;

-- Ver estatísticas por evento
SELECT
  e.name as evento,
  e.slug,
  e.template_name,
  COUNT(g.id) as total_convidados,
  SUM(CASE WHEN g.status = 'confirmed' THEN 1 ELSE 0 END) as confirmados,
  SUM(CASE WHEN g.status = 'declined' THEN 1 ELSE 0 END) as recusados,
  SUM(CASE WHEN g.status = 'pending' THEN 1 ELSE 0 END) as pendentes
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
GROUP BY e.id, e.name, e.slug, e.template_name
ORDER BY e.event_date;
