-- Task progress table — tracks transcription tasks submitted by contractors
create table if not exists public.task_progress (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  task_id         text not null,
  status          text not null default 'available'
                  check (status in ('available', 'in_progress', 'submitted', 'reviewed')),
  transcription_text text,
  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  earnings_usd    numeric(10,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists task_progress_application_id_idx on public.task_progress(application_id);
create index if not exists task_progress_status_idx on public.task_progress(status);
create index if not exists task_progress_submitted_at_idx on public.task_progress(submitted_at desc);

alter table public.task_progress enable row level security;
create policy "service role full access" on public.task_progress using (true) with check (true);

drop trigger if exists task_progress_set_updated_at on public.task_progress;
create trigger task_progress_set_updated_at
  before update on public.task_progress
  for each row execute function public.set_updated_at();
