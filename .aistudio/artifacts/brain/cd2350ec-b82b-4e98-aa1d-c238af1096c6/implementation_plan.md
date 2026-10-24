# Implementation Plan — Configure Supabase to Accept & Register Google Users

## Completed Changes

### 1. Dedicated Supabase Google Sync Endpoint (`src/app/api/auth/google-sync/route.ts`)
- Implemented `/api/auth/google-sync` route to register and sync Google users with Supabase backend.
- When `SUPABASE_SERVICE_ROLE_KEY` is present:
  - Looks up any existing account with the given email in `public.users` or `auth.users`.
  - Reuses the existing UUID to ensure PostgreSQL's `users_email_key` unique constraint is never violated.
  - Registers the user in `auth.users` with `email_confirm: true` and Google provider metadata if not yet created.
  - Upserts the public profile cleanly.
- When running in demo/sandbox mode:
  - Generates the canonical unified profile matching the user's role and email (Admin for `taxwiseplatform@gmail.com`).

### 2. Client-Side Google Sign-In & Supabase Integration (`src/lib/googleAuth.ts`)
- In `signInWithGoogle()`, after the authentic Google popup resolves, sends credentials to `/api/auth/google-sync`.
- Receives the canonical deduplicated user profile and synchronizes it into local session, persistent storage (`taxwise_active_user`), and the Supabase client.
- Dispatches `taxwise_auth_changed` for immediate multi-component synchronization.

### 3. Duplicate Prevention in Mock Supabase Client (`src/lib/supabaseClient.ts`)
- Enhanced `MockQueryBuilder` for `users`: on `insert` and `upsert`, checks if a user with matching email or ID already exists; if found, updates in place instead of creating a duplicate row.
- Updated `getMockProfile()` and `getMockSession()` to always prioritize the active verified user (`taxwise_active_user`).

---

## Verification
- ESLint: 0 errors
- Turbopack Compilation: Succeeded
- Dev Server: Restarted cleanly
