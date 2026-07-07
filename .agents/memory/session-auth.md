---
name: Session auth architecture
description: How workspace authentication works — cookie, verify endpoint, server functions, DB tables needed.
---

## Auth flow

Email magic link → `/api/auth/verify?t=TOKEN[&next=/onboarding]`
- Validates token from `application_tokens` (type `onboarding`)
- Conditional update (`.is("used_at", null)`) prevents replay attacks
- Sets HMAC-signed `wn_session` cookie (base64url(appId).hmac)
- Redirects to `next` (defaults `/workspace`)

Sign-out → `/api/auth/signout` (GET) → clears cookie → redirects `/`

## Cookie

`src/lib/server/session.ts` — `buildSessionCookie`, `clearSessionCookie`, `getApplicationIdFromCookies`
- Uses `SESSION_SECRET` env var (throws in production if missing/short)
- Adds `Secure` flag in production (`NODE_ENV === "production"`)
- Cookie name: `wn_session`

## Server functions added (actions.ts)

All use `getRequestHeader("cookie")` → `getApplicationIdFromCookies` → applicationId:
- `getWorkspaceBySession` — main session check, returns candidateName/roleTitle/ndaSigned/contractSubmitted
- `getTaskProgressBySession` — reads `task_progress` table
- `submitTranscriptionTask` — upserts to `task_progress`
- `getPaymentInfoBySession` / `savePaymentInfoBySession` — reads/writes `payment_info`
- `onboardingGetBySession` — returns name/role for onboarding page
- `onboardingCompleteBySession` — marks application status=onboarding
- `sendSupportMessageBySession` — emails admin

## DB tables needed

Run `src/db/schema-additions.sql` in Supabase dashboard:
- `task_progress` (application_id, task_id, status, transcription_text, submitted_at, reviewed_at, earnings_usd)
- `payment_info` (application_id, payment_method, account_email, account_name)
- Unique constraints: (application_id, task_id) and (application_id)

If tables don't exist, task progress falls back to localStorage (`wn_task_progress_${applicationId}`).

## Task unlock logic

Tasks 1-10 in 4 groups (3+3+3+1). `computeEffectiveStatus(task, progress, contractSubmitted)`:
- If `!contractSubmitted` → all locked
- Group 1: always available
- Group N: requires all group N-1 tasks to be `submitted` or `reviewed`

## Email links

- `resendWorkspaceLink` → `/api/auth/verify?t=TOKEN` (→ /workspace)
- `pipelineSubmitSkillsProfile` → `/api/auth/verify?t=TOKEN&next=/onboarding`

**Why:** Token-in-URL auth exposed applicationId in browser history/referrer headers and didn't expire on use.
**How to apply:** Any new email links that grant workspace access should go through `/api/auth/verify?t=TOKEN`.
