-- Migration: Create import_logs table
-- Description: Stores logs of guest import operations with error details
-- Date: 2025-01-20

-- Create import_logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id BIGSERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  filename VARCHAR(255),
  total_rows INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  imported_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_import_logs_event_id ON import_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON import_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);

-- Add comments for documentation
COMMENT ON TABLE import_logs IS 'Stores logs of CSV import operations for guests';
COMMENT ON COLUMN import_logs.event_id IS 'Reference to the event for which guests were imported';
COMMENT ON COLUMN import_logs.filename IS 'Name of the uploaded CSV file';
COMMENT ON COLUMN import_logs.total_rows IS 'Total number of rows processed from CSV';
COMMENT ON COLUMN import_logs.inserted IS 'Number of guests successfully inserted';
COMMENT ON COLUMN import_logs.errors IS 'Number of errors encountered';
COMMENT ON COLUMN import_logs.error_details IS 'JSON array with error details: [{row: number, error: string}]';
COMMENT ON COLUMN import_logs.status IS 'Status of the import: completed, partial, failed';
COMMENT ON COLUMN import_logs.imported_by IS 'Admin username or identifier who performed the import';

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_import_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_import_logs_updated_at
  BEFORE UPDATE ON import_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_logs_updated_at();
