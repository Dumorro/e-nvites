/**
 * Script to add qr_code column to guests table
 *
 * Run this script with: npx tsx scripts/add-qr-code-column.ts
 */

import { supabase } from '../lib/supabase'

async function addQrCodeColumn() {
  console.log('Adding qr_code column to guests table...')

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add qr_code column to guests table
        ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code TEXT;

        -- Add comment to the column
        COMMENT ON COLUMN guests.qr_code IS 'QR Code data for the guest invitation';

        -- Create an index on qr_code for faster lookups
        CREATE INDEX IF NOT EXISTS idx_guests_qr_code ON guests(qr_code);
      `
    })

    if (error) {
      console.error('Error running migration:', error)
      process.exit(1)
    }

    console.log('✅ Successfully added qr_code column to guests table!')
    console.log('The column is now ready to store QR code data for guest invitations.')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Run the migration
addQrCodeColumn()
