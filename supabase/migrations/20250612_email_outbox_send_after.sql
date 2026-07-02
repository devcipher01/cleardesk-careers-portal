alter table public.email_outbox add column if not exists send_after timestamptz;
update public.email_outbox set send_after = created_at where send_after is null;
