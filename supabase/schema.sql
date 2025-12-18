-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists employees (
  employee_id text primary key,
  full_name text not null,
  department text not null,
  status text not null default 'active',
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  event_name text not null,
  status text not null default 'active', -- active | closed
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  started_by_device_id text
);

-- Ensure only one active session at a time
create unique index if not exists one_active_session_idx
on sessions ((status))
where status = 'active';

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(session_id) on delete cascade,
  employee_id text not null references employees(employee_id) on delete restrict,
  method text not null check (method in ('scan','manual')),
  device_id text not null,
  recorded_at timestamptz not null default now()
);

-- Prevent duplicate recording for the same employee in the same session
create unique index if not exists attendance_unique_per_session_employee
on attendance(session_id, employee_id);

create index if not exists attendance_session_idx on attendance(session_id);
create index if not exists attendance_recorded_at_idx on attendance(recorded_at);

-- Optional: device labels
create table if not exists devices (
  device_id text primary key,
  label text,
  last_seen timestamptz not null default now()
);
