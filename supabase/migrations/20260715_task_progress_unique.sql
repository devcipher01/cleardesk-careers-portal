-- Add unique constraint required for upsert onConflict to work
alter table public.task_progress
  add constraint task_progress_app_task_unique unique (application_id, task_id);
