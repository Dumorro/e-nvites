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
