# Local testing — careers pipeline

## 1. Start without Supabase

```bash
cp .env.example .env
# Leave SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY empty
LOCAL_DEV_MODE=true
LOCAL_PIPELINE_EMAIL_DELAY_MS=0
npm run dev
```

Open **http://localhost:5000**

## 2. Test kit page (emails + quick links)

**http://localhost:5000/dev/pipeline**

## 3. Click path (full flow)

| Step | URL | What to do |
|------|-----|------------|
| Start | http://localhost:5000/careers/apply | Submit the 3-step form |
| Auto | http://localhost:5000/careers/assessment?applicationId=... | Answer role-specific questions |
| Success | Assessment page | No workspace button — email only (18–24h in prod) |
| Workspace | http://localhost:5000/workspace?applicationId=... | Org desktop (from email link when qualified) |
| Setup | http://localhost:5000/onboarding/workspace-setup?applicationId=... | NDA → contract ($24.50/hr) → V-VDE token |

## 4. Emails

- **Apply receipt** (`We received your application`): sent **immediately** after application submit (includes link to Skills Profile Review).
- **Hired / onboarding email** (`Welcome to Worknesta — You're hired`): scheduled **18–24 hours** after Skills Profile Review submit; Vercel **daily cron** (`/api/cron/emails`) delivers it.
- **Admin notify** (`ADMIN_NOTIFY_EMAIL`, default `profdanx@gmail.com`): **instant** on skills profile submit (score summary).
- Local mode: all emails log to terminal and `/dev/pipeline`.

## 5. Production (Vercel + Supabase + Brevo)

Required env vars:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOCAL_DEV_MODE=false`
- `PUBLIC_BASE_URL=https://worknesta.com`
- `MAIL_FROM="Worknesta <talent@worknesta.com>"` + all `SMTP_*` vars
- `ADMIN_NOTIFY_EMAIL=profdanx@gmail.com`
- `CRON_SECRET` (random string) — Vercel cron hits `/api/cron/emails` daily to send scheduled emails
