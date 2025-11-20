# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **e-nvites**, a multi-event RSVP confirmation system built for Equinor events. The system manages guest invitations, RSVP confirmations, and QR code generation for event check-in. It supports multiple simultaneous events (currently Rio de Janeiro and São Paulo oil celebration events).

**Tech Stack:** Next.js 16 (App Router), TypeScript, React 19, Supabase (PostgreSQL), Tailwind CSS

## Common Commands

```bash
# Development
npm run dev                              # Start dev server on :3000
npm run build                            # Production build
npm run start                            # Start production server
npm run lint                             # ESLint check

# Utility Scripts
npm run check-pdfs                       # Verify PDF files exist for guests
npm run generate-qr-codes                # Generate QR codes for guests
npm run generate-qr-codes:sequential     # Generate QR codes one-by-one (slower but safer)
```

## Architecture & Key Concepts

### Multi-Event System

The codebase is designed to handle multiple events simultaneously. The architecture centers around two database tables:

**events table** - Stores event metadata (name, slug, colors, messages, template references)
**guests table** - Links to events via `event_id` foreign key, stores RSVP status and GUID

Event-specific routes exist for different confirmation flows:
- `/rsvp-rj` → `/confirm-rj` (Rio de Janeiro event)
- `/rsvp-sp` → `/confirm-sp` (São Paulo event)
- Main RSVP page: `/?guid={guest-guid}` (works for any event)

### GUID-Based Invitation System

Each guest gets a unique UUID (`guid` column) used to generate personalized invitation links:
- Format: `https://yourdomain.com/?guid=123e4567-e89b-12d3-a456-426614174000`
- Non-sequential GUIDs prevent guest enumeration
- Admin can copy individual invite links from `/admin` dashboard

### Database Schema

```
events (1) -----> (Many) guests
  ↓                         ↓
  id                  event_id (FK)
  slug                guid (UUID)
  name                name, email, phone
  event_date          status (pending|confirmed|declined)
  template_name       qr_code (optional)
  *_color
  welcome_message
  show_qr_code
```

**Important:** Row Level Security (RLS) is enabled. Public reads are allowed, but updates are restricted to the `status` field only.

### API Routes Structure

All APIs are under `/app/api/rsvp/`:
- `route.ts` - GET guest by GUID, POST to update RSVP status
- `list/route.ts` - GET all guests (admin only, requires `x-admin-password` header)
- `guest/route.ts` - GET guest details by GUID
- `confirm-by-email/route.ts` - POST email-based confirmation (for event-specific forms)

### Client-Side Architecture

All page components use `'use client'` directive (no server components in pages). State management via React hooks. Session storage used for admin authentication persistence.

## Equinor Branding

This system is Equinor-branded. Key brand assets:
- **Primary color:** `#d81e3a` (equinor-red)
- **Secondary color:** `#07364f` (equinor-navy)
- **Logo:** `public/images/equinor-logo.png`
- Color palette defined in `tailwind.config.ts`

Do not remove or significantly alter Equinor branding without explicit request.

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_PASSWORD=your_admin_password
```

The `ADMIN_PASSWORD` is used for simple password-based authentication at `/admin`.

## Working with Events

To add a new event:
1. Insert record into Supabase `events` table with required fields (name, slug, event_date, location)
2. Optionally create event-specific routes like `app/rsvp-{slug}/page.tsx` and `app/confirm-{slug}/page.tsx`
3. Update templates if using custom HTML email templates
4. Add guests to `guests` table with corresponding `event_id`

To add guests for an event:
- **Recommended:** Use `/admin/import-guests` page for CSV bulk import (includes validation and error logging)
- Insert directly in Supabase Table Editor, or
- Use SQL in Supabase SQL Editor with bulk INSERT
- System auto-generates GUID for each guest

### Bulk Import via Admin Panel

Access `/admin/import-guests` to import guests in bulk:
- Upload CSV file with format: `qrcode,nome,email,celular`
- Preview data before importing
- Automatic validation of required fields (qrcode, nome)
- **Logs saved to database** (serverless-compatible)
- View import history at `/admin/import-logs`
- See [`exemplo-importacao-convidados.csv`](public/exemplo-importacao-convidados.csv) for CSV format

**Import Logs**: All import operations are logged to the `import_logs` table in the database, including error details stored as JSONB. View complete history with filtering at `/admin/import-logs`.

## Phone Number Format

Phone numbers are stored without formatting (numbers only):
- Format: `5531999887766` (country code + area code + number)
- Display format: Automatically formatted to `+55 (31) 99988-7766` in UI
- **Always store numbers only** in database

## QR Codes

QR codes are stored as data URIs in the `qr_code` column. Generate QR codes using:
```bash
npm run generate-qr-codes
```

This script reads all guests and generates QR codes containing their GUID. QR codes are displayed on confirmation pages when `events.show_qr_code = true`.

## PDF Management

Event invitations are stored as PDFs in:
- `public/events/oil-celebration-rj/` (Rio event)
- `public/events/oil-celebration-sp/` (São Paulo event)

Verify PDF files exist for all guests:
```bash
npm run check-pdfs
```

PDF filenames should match guest records (details in `GUIA_PDFS.md`).

## Admin Dashboard

Access: `/admin` (requires password authentication)

Features:
- View all guests across all events
- Filter by status, event, or search by name
- Pagination (20/50/100 per page)
- Real-time statistics (total/confirmed/declined/pending)
- Copy individual invite links

Authentication is stored in `sessionStorage` and validated via `x-admin-password` header on API calls.

## Status Field Values

Guest status must be one of three values:
- `'pending'` - Default, no response yet
- `'confirmed'` - Guest confirmed attendance
- `'declined'` - Guest declined invitation

## Documentation Files

Extensive documentation exists (all in Portuguese):
- `README.md` - Main project docs
- `SETUP.md` - Quick setup guide
- `COMO_CADASTRAR_EVENTOS.md` - Event registration guide
- `EQUINOR_BRANDING.md` - Brand guidelines
- `GUIA_PDFS.md` - PDF management guide
- `MIGRATION_INSTRUCTIONS.md` - Database migration docs
- `CHANGELOG.md` - Detailed feature history

Refer to these when questions arise about specific features.

## Type Definitions

All TypeScript interfaces are in `lib/supabase.ts`:
- `Guest` - Guest record structure
- `Event` - Event record structure

Always use these types when working with database records to maintain type safety.

## Deployment

Designed for Vercel deployment (Next.js native). Set environment variables in Vercel dashboard before deploying. The project uses the App Router, so ensure the deployment platform supports Next.js 14+.
