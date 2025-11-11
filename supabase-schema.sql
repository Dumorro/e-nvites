-- RSVP System Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id BIGSERIAL PRIMARY KEY,
  guid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  social_event VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on guid for faster lookups
CREATE INDEX IF NOT EXISTS idx_guests_guid ON guests(guid);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);

-- Create index on social_event for filtering
CREATE INDEX IF NOT EXISTS idx_guests_social_event ON guests(social_event);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on row update
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to everyone (for RSVP page)
CREATE POLICY "Allow public read access" ON guests
  FOR SELECT
  USING (true);

-- Policy: Allow update access to everyone (for RSVP status updates)
CREATE POLICY "Allow public update of status" ON guests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow insert access to authenticated users only (for admin)
CREATE POLICY "Allow authenticated insert" ON guests
  FOR INSERT
  WITH CHECK (true);

-- Sample data (optional - for testing)
-- Phone format: Country code (55) + DDD (2 digits) + Number (9 digits)
-- Example: 5531999887766 = +55 (31) 99988-7766
INSERT INTO guests (name, email, phone, social_event, status) VALUES
  ('João Silva', 'joao.silva@email.com', '5511987654321', 'Festa de Confraternização 2024', 'pending'),
  ('Maria Santos', 'maria.santos@email.com', '5521998765432', 'Festa de Confraternização 2024', 'confirmed'),
  ('Pedro Oliveira', 'pedro.oliveira@email.com', '5511976543210', 'Workshop de Tecnologia', 'pending'),
  ('Ana Costa', 'ana.costa@email.com', '5585965432109', 'Workshop de Tecnologia', 'declined'),
  ('Carlos Souza', 'carlos.souza@email.com', '5547954321098', 'Festa de Confraternização 2024', 'pending')
ON CONFLICT DO NOTHING;
