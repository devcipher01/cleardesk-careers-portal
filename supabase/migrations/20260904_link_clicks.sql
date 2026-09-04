-- Outbound link click events (e.g. Settings Get certificate)
create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_key text not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists link_clicks_link_key_created_at_idx
  on public.link_clicks (link_key, created_at desc);

create index if not exists link_clicks_application_id_idx
  on public.link_clicks (application_id);

alter table public.link_clicks enable row level security;
