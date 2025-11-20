# Database Migrations

This directory contains SQL migration files for the e-nvites database.

## How to Apply Migrations

Run these SQL scripts in your Supabase SQL Editor in the order they appear:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of the migration file
5. Execute the query

## Available Migrations

### 1. add_invite_image_column.sql

Adds the `invite_image_base64` column to the `guests` table to support storing invite images as base64 encoded data URIs.

### 2. create_indexes.sql

Creates performance indexes for the most frequent queries in the application.

**Why:** Optimizing database queries is essential for application performance. Without proper indexes, queries use Sequential Scan (O(n)), which becomes slow with large datasets. Indexes enable Index Scan (O(log n)), providing 100-1000x performance improvement.

**Impact:**
- Faster RSVP confirmations (guid lookup)
- Faster admin dashboard (filtering and sorting)
- Faster image retrieval (qr_code + event_id lookup)
- Faster email sending (image attachment lookup)

**Indexes Created:** 18 indexes across `guests`, `events`, and `email_logs` tables.

For detailed explanation of each index, see [`GUIA_INDICES.md`](../GUIA_INDICES.md).

### 3. add_unique_qr_code_event.sql

Adds a unique constraint on the combination of `qr_code` and `event_id` to prevent duplicate QR codes within the same event.

**Why:** Ensures data integrity by preventing duplicate QR codes from being created for the same event. This is critical for the guest check-in system and invitation distribution.

**Benefits:**
- Prevents accidental duplicate entries during CSV imports
- Ensures each QR code is unique per event
- Allows the same QR code to exist across different events (if needed)
- Improves query performance for QR code lookups

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_guests_qr_code_event_unique;
```

### 4. create_import_logs_table.sql

Creates the `import_logs` table to store logs of guest CSV import operations.

**Why:** Since the application is hosted on Supabase (serverless environment with no file write permissions), we need to store import logs in the database instead of generating downloadable files.

**Benefits:**
- Persistent storage of all import operations
- Detailed error tracking with JSON storage
- Audit trail of who imported what and when
- Easy filtering and searching of import history
- No need for file system access

**Table Structure:**
- `id`: Auto-incrementing primary key
- `event_id`: Reference to the event
- `filename`: Original CSV filename
- `total_rows`: Number of rows processed
- `inserted`: Number of successfully inserted guests
- `errors`: Number of errors encountered
- `error_details`: JSONB array with error details
- `status`: Import status (completed, partial, failed)
- `imported_by`: Admin who performed the import
- `created_at`, `updated_at`: Timestamps

**Rollback:**
```sql
DROP TABLE IF EXISTS import_logs CASCADE;
```

---

## Migration Details

### add_invite_image_column.sql

**Why:** Vercel and other serverless platforms have read-only filesystems (except `/tmp`), making it impossible to write invite images to the `public/` directory at runtime. Storing images in the database as base64 solves this limitation.

**Column Details:**
- Column: `invite_image_base64`
- Type: `TEXT` (nullable)
- Stores: Complete data URI format (e.g., `data:image/png;base64,iVBORw0KGgo...`)

**Usage:**
After applying this migration, you can:
1. Upload ZIP files with invite images via `/admin/upload-invites`
2. Images will be stored in the database
3. Email attachments will retrieve images from database
4. Download functionality will retrieve images from database
5. Falls back to filesystem for backward compatibility with existing images

## Rollback

To rollback the `add_invite_image_column` migration:

```sql
ALTER TABLE guests DROP COLUMN IF EXISTS invite_image_base64;
```
