alter table public.applications
  add column if not exists market text not null default 'ng';

alter table public.applications
  drop constraint if exists applications_market_check;

alter table public.applications
  add constraint applications_market_check check (market in ('ng', 'ph'));

create index if not exists applications_market_idx on public.applications(market);
