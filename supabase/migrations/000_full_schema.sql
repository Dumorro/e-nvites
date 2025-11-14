-- RSVP System Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- ==============================================================
-- 1. Create helper function first
-- ==============================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- 2. Create events table
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

-- Create indexes on events
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- Trigger to update updated_at on events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- 3. Create guests table
-- ==============================================================

CREATE TABLE IF NOT EXISTS guests (
  id BIGSERIAL PRIMARY KEY,
  guid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  social_event VARCHAR(255),
  event_id BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_guests_events FOREIGN KEY (event_id) 
    REFERENCES events(id) ON DELETE SET NULL
);

-- Create indexes on guests
CREATE INDEX IF NOT EXISTS idx_guests_guid ON guests(guid);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_social_event ON guests(social_event);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);

-- Trigger to update updated_at on guests table
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at 
  BEFORE UPDATE ON guests
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- 4. Configure Row Level Security (RLS)
-- ==============================================================

-- Enable RLS on guests table
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON guests;
DROP POLICY IF EXISTS "Allow public update of status" ON guests;
DROP POLICY IF EXISTS "Allow authenticated insert" ON guests;

-- Create policies for guests table
CREATE POLICY "Allow public read access" ON guests
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public update of status" ON guests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON guests
  FOR INSERT
  WITH CHECK (true);

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on events" ON events;
DROP POLICY IF EXISTS "Allow admin access on events" ON events;

-- Create policies for events table
CREATE POLICY "Allow public read access on events" ON events
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin access on events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==============================================================
-- 5. Migration: Link existing guests to events
-- ==============================================================

-- Create events from existing social_event values
INSERT INTO events (name, slug, is_active, description)
SELECT DISTINCT
  social_event,
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(social_event, ' ', '-'),
          'ã', 'a'
        ),
        'ç', 'c'
      ),
      'õ', 'o'
    )
  ),
  true,
  'Evento migrado automaticamente'
FROM guests
WHERE social_event IS NOT NULL
  AND social_event <> ''
  AND social_event NOT IN (SELECT name FROM events)
ON CONFLICT (name) DO NOTHING;

-- Update event_id in guests based on social_event
UPDATE guests
SET event_id = events.id
FROM events
WHERE guests.social_event = events.name
  AND guests.event_id IS NULL;

-- ==============================================================
-- 6. Sample data (optional - for testing)
-- ==============================================================

-- Insert sample events
INSERT INTO events (name, slug, description, event_date, location, template_name) VALUES
  ('Festa de Confraternização RJ 2024', 'festa-confraternizacao-rj-2024', 'Festa de fim de ano da Equinor no Rio de Janeiro', '2024-12-20 19:00:00-03', 'Rio de Janeiro', 'equinor-convite-RJ'),
  ('Festa de Confraternização SP 2024', 'festa-confraternizacao-sp-2024', 'Festa de fim de ano da Equinor em São Paulo', '2024-12-22 19:00:00-03', 'São Paulo', 'equinor-convite-SP')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample guests
INSERT INTO guests (name, email, phone, social_event, status) VALUES
  ('João Silva', 'joao.silva@email.com', '5511987654321', 'Festa de Confraternização RJ 2024', 'pending'),
  ('Maria Santos', 'maria.santos@email.com', '5521998765432', 'Festa de Confraternização RJ 2024', 'confirmed'),
  ('Pedro Oliveira', 'pedro.oliveira@email.com', '5511976543210', 'Festa de Confraternização SP 2024', 'pending'),
  ('Ana Costa', 'ana.costa@email.com', '5585965432109', 'Festa de Confraternização SP 2024', 'declined'),
  ('Carlos Souza', 'carlos.souza@email.com', '5547954321098', 'Festa de Confraternização RJ 2024', 'pending')
ON CONFLICT (guid) DO NOTHING;

-- Link sample guests to events
UPDATE guests
SET event_id = events.id
FROM events
WHERE guests.social_event = events.name
  AND guests.event_id IS NULL;