---
name: Session auth architecture
description: How auth, session identity, and access control work after the Supabase Auth migration
---

## Current auth stack

- **Sign-in flow**: magic links via Supabase Auth admin (`sb.auth.admin.generateLink`) — every entry path goes through `/api/auth/verify` which validates a one-time token, generates a Supabase magic link, redirects the browser through Supabase → `/auth/callback` → destination.
- **Session persistence**: Supabase stores the session in localStorage automatically (survives tab close/reopen).
- **Client session helper**: `getSessionData()` in `src/lib/client/supabase.ts` returns `{ appId, accessToken }` from the live session. All workspace and onboarding pages call this and pass both to server functions.
- **Server-side identity verification**: `resolveAppId(clientAppId, accessToken)` in `actions.ts` is async — it verifies the access token via `sb.auth.getUser(accessToken)` and extracts `applicationId` from user metadata. Falls back to UUID-format `clientAppId` only if no token is provided.
- **applicationId in Supabase user metadata**: set in `/api/auth/verify` via `admin.updateUserById` after magic link generation; also set via `generateLink`'s `data` option for new users.

## Key decisions

- Every server function that touches candidate data (`getWorkspaceBySession`, `getTaskProgressBySession`, `submitTranscriptionTask`, `getPaymentInfoBySession`, `savePaymentInfoBySession`, `onboardingGetBySession`, `onboardingCompleteBySession`, `sendSupportMessageBySession`) accepts `{ clientAppId?, accessToken? }` — the access token provides JWT-verified identity.
- Token mark-used (`used_at`) in `/api/auth/verify` happens AFTER `generateLink` succeeds, so failed magic-link generation doesn't burn the one-time token.
- Sign-out: primary path is `supabase.auth.signOut()` client-side in OrgShell. `/api/auth/signout` redirects to `/signout` page (client-rendered, clears session then navigates home). Covers stale bookmarks.
- Onboarding has two paths: (1) Supabase session primary (for links routed through `/api/auth/verify`), (2) legacy direct-token fallback for old email links.

## SSR gotcha — Supabase browser client

**Why:** `createClient(url, key)` runs at module evaluation time. During Vite SSR, `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` may be undefined if not in process.env, causing `supabaseUrl is required` crash.

**How to apply:** Always use `?? "https://placeholder.supabase.co"` / `?? "placeholder-anon-key"` fallbacks in `src/lib/client/supabase.ts`. Auth methods are only invoked client-side (useEffect / async handlers), so the placeholder client is never exercised at runtime.

## Schema

Run `src/db/schema-additions.sql` in Supabase SQL editor for session persistence tables (`workspace_onboarding`, `task_progress`, `payment_info` etc.).

## Supabase project setup required

Add the Replit preview domain `https://<repl-slug>.janeway.replit.dev/**` to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs before magic links work end-to-end.
