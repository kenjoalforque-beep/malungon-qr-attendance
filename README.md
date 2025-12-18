# Malungon QR Attendance (Vercel + Supabase)

This is a standalone web app (PWA-ready structure) that supports:
- One active session at a time (admin must end session first)
- Session ID includes event name code + date + time (e.g., FL-20251218-032839)
- Scanner page: QR scan + Manual entry (Employee ID) fallback
- Duplicate attempts show yellow with first recorded date/time, **not recorded**
- Invalid QR/ID shows red, **not recorded**
- HR dashboard: live totals + dept ranking (highest first) + scan/manual counts + LGU completion %

## Environment variables
Copy `.env.example` to `.env.local` for local dev.

## Supabase
Run `supabase/schema.sql` in Supabase SQL Editor.

## Vercel
Set env vars in Vercel project settings and deploy.

> Note: This build uses Next.js API routes to talk to Supabase with `SUPABASE_SERVICE_ROLE_KEY`,
> so you can keep database reads/writes protected behind a simple `ADMIN_PIN`.
