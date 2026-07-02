-- Worknesta hiring flow schema
-- Intended for Supabase Postgres (run in SQL editor or as a migration).

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type application_status as enum (
      'pending',
      'interview_sent',
      'interview_complete',
      'assessment_sent',
      'assessment_complete',
      'offer_sent',
      'offer_accepted',
      'offer_declined',
      'onboarding',
      'active',
      'rejected'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'token_type') then
    create type token_type as enum ('interview', 'assessment', 'offer', 'onboarding');
  end if;
end $$;

-- Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status application_status not null default 'pending',

  full_name text not null,
  email text not null,
  phone text not null,
  country text not null,
  timezone text not null,
  role_slug text not null,
  role_title text not null,

  has_computer boolean not null,
  internet text not null,
  typing_speed text not null,
  availability text not null,
  hours_per_week int not null,

  why_remote text not null,
  experience text not null,
  worked_remote boolean not null,
  remote_description text,
  source text not null,

  resume_filename text,
  resume_mime text,
  resume_size_bytes bigint
);

create index if not exists applications_created_at_idx on public.applications(created_at desc);
create index if not exists applications_status_idx on public.applications(status);
create index if not exists applications_email_idx on public.applications(lower(email));

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- Tokens (private links)
create table if not exists public.application_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  application_id uuid not null references public.applications(id) on delete cascade,
  type token_type not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,

  -- snapshot at issuance time
  role_slug text not null,
  role_title text not null
);

create index if not exists application_tokens_app_idx on public.application_tokens(application_id);
create index if not exists application_tokens_token_idx on public.application_tokens(token);

-- Interview responses
create table if not exists public.interview_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  application_id uuid not null references public.applications(id) on delete cascade,
  token_id uuid not null references public.application_tokens(id) on delete cascade,

  name text not null,
  email text not null,
  submitted_at timestamptz not null,
  time_taken_seconds int,

  answers jsonb not null
);

-- Assessment submissions
create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  application_id uuid not null references public.applications(id) on delete cascade,
  token_id uuid not null references public.application_tokens(id) on delete cascade,

  name text not null,
  email text not null,
  submitted_at timestamptz not null,
  time_taken_seconds int,

  kind text not null, -- transcription | data-entry | qa
  payload jsonb not null
);

-- Offers
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  application_id uuid not null references public.applications(id) on delete cascade,
  token_id uuid not null references public.application_tokens(id) on delete cascade,

  pay_rate_usd_per_hour text not null,
  start_date text not null,
  contract_duration text not null,

  accepted_at timestamptz,
  declined_at timestamptz,
  decline_reason text,
  decline_note text,

  signature_name text,
  signature_date text,
  signature_ip text
);

-- Onboarding
create table if not exists public.onboarding (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  application_id uuid not null references public.applications(id) on delete cascade,
  token_id uuid not null references public.application_tokens(id) on delete cascade,

  completed_at timestamptz
);

-- Email outbox (for automation + fallback when SMTP isn't configured)
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  to_email text not null,
  subject text not null,
  html text not null,
  text text,

  status text not null default 'queued', -- queued | scheduled | sent | error
  send_after timestamptz,
  sent_at timestamptz,
  error text
);

create index if not exists email_outbox_status_idx on public.email_outbox(status, created_at);

-- Public careers pipeline (apply → skills profile → workspace setup)
create table if not exists public.skills_profile_submissions (
  application_id uuid primary key references public.applications(id) on delete cascade,
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null,
  answers jsonb not null,
  score_percent int not null,
  selected_for_workspace boolean not null default false
);

create table if not exists public.workspace_onboarding (
  application_id uuid primary key references public.applications(id) on delete cascade,
  created_at timestamptz not null default now(),
  nda_legal_name text,
  nda_signature text,
  nda_signed_at timestamptz,
  declare_accurate boolean,
  agree_schedule boolean,
  employee_signature text,
  witness_signature text,
  vde_token text,
  contract_submitted_at timestamptz
);

-- RLS (recommended: keep everything server-side via service role)
alter table public.applications enable row level security;
alter table public.application_tokens enable row level security;
alter table public.interview_responses enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.offers enable row level security;
alter table public.onboarding enable row level security;
alter table public.email_outbox enable row level security;
alter table public.skills_profile_submissions enable row level security;
alter table public.workspace_onboarding enable row level security;

-- No public policies by default. Use service role for all operations.

