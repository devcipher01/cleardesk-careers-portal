-- Run this in your Supabase SQL editor to enable persistent task progress and payment info.

-- Task progress per contractor
CREATE TABLE IF NOT EXISTS task_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  task_id text NOT NULL,                   -- e.g. "t01", "t08"
  status text NOT NULL DEFAULT 'available', -- available | in_progress | submitted | reviewed
  transcription_text text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  earnings_usd numeric(10, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (application_id, task_id)
);

-- Payment info per contractor
CREATE TABLE IF NOT EXISTS payment_info (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  payment_method text,        -- 'wise' | 'payoneer'
  account_email text,
  account_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS task_progress_app_idx ON task_progress (application_id);
CREATE INDEX IF NOT EXISTS payment_info_app_idx ON payment_info (application_id);
