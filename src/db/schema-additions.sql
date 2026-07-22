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
  payment_method text,        -- 'wise' | 'payoneer' | 'paypal' | 'bank_transfer'
  account_email text,
  account_name text,
  extra_details text,         -- JSON string for method-specific fields (bank transfer, etc.)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- If table already exists, add the extra_details column if missing:
ALTER TABLE payment_info ADD COLUMN IF NOT EXISTS extra_details text;

-- Contractor uploaded documents (medical certs, ID docs, etc.)
CREATE TABLE IF NOT EXISTS contractor_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL,          -- 'medical_cert' | 'id_document' | 'other'
  file_name text NOT NULL,
  storage_path text NOT NULL,      -- path inside the 'contractor-docs' Storage bucket
  uploaded_at timestamptz DEFAULT now(),
  verified_at timestamptz,         -- set by admin when cert is approved
  verified_by text                 -- admin note / email
);
-- One doc per type per contractor (re-upload replaces it)
CREATE UNIQUE INDEX IF NOT EXISTS contractor_docs_app_type_idx ON contractor_documents (application_id, doc_type);
CREATE INDEX IF NOT EXISTS contractor_docs_app_idx ON contractor_documents (application_id);

-- Indexes
CREATE INDEX IF NOT EXISTS task_progress_app_idx ON task_progress (application_id);
CREATE INDEX IF NOT EXISTS payment_info_app_idx ON payment_info (application_id);
