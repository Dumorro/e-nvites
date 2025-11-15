-- Add qr_code column to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add comment to the column
COMMENT ON COLUMN guests.qr_code IS 'QR Code data for the guest invitation';

-- Create an index on qr_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_guests_qr_code ON guests(qr_code);
