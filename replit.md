# Worknesta Careers Portal

A fullstack careers pipeline app built with TanStack Start (React 19), Vite, Tailwind CSS v4, and Supabase.

## Stack

- **Frontend/SSR**: TanStack Start + TanStack Router + React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer via Brevo SMTP
- **Build tool**: Vite

## Running the app

```bash
npm run dev   # starts dev server on port 5000
```

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Home / landing page |
| `/careers` | Jobs listing |
| `/careers/:slug` | Job detail |
| `/careers/apply` | 3-step application form |
| `/careers/assessment` | Role-specific skills assessment |
| `/workspace` | Hired candidate org desktop |
| `/onboarding/workspace-setup` | NDA → contract → V-VDE token |
| `/admin` | Admin panel (password protected) |
| `/dev/pipeline` | Dev-only email test kit |

## Environment variables

All secrets are stored in Replit Secrets. Non-secret vars are in shared env:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (secret) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |
| `ADMIN_PASSWORD` | Admin panel password (secret) |
| `SMTP_HOST/PORT/USER/PASS` | Brevo SMTP credentials (secret) |
| `CRON_SECRET` | Cron endpoint auth token (secret) |
| `PUBLIC_BASE_URL` | App's public URL |
| `LOCAL_DEV_MODE` | Set `true` to skip Supabase in dev |
| `MAIL_FROM` | Sender address for emails |
| `ADMIN_NOTIFY_EMAIL` | Email to notify on new applications |

## Local dev without Supabase

Set `LOCAL_DEV_MODE=true` and leave Supabase vars empty. Emails log to terminal instead of sending. Visit `/dev/pipeline` for the email test kit.

## User preferences

- Keep existing project structure and stack
