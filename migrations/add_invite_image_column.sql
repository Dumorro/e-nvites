-- Add invite_image_base64 column to guests table
-- This column will store the invite image as a base64 encoded string
-- to avoid filesystem limitations in serverless environments

ALTER TABLE guests
ADD COLUMN invite_image_base64 TEXT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN guests.invite_image_base64 IS 'Base64 encoded invite image for the guest. Stores the complete data URI (e.g., data:image/png;base64,...)';
