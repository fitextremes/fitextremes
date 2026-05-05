## Problem

When the business user clicks the password reset link in their email, they land on `/reset-password` and immediately see **"Invalid Reset Link"** instead of the new-password form.

## Root Cause

Confirmed from the auth logs:

```
POST /recover  → 200  (email sent)
GET  /verify   → 303 redirect to /reset-password   ✅ token IS valid
action: "login", login_method: "implicit"          ✅ session WAS established
```

So the recovery token works fine on the backend — Supabase verifies it and redirects to `/reset-password#access_token=...&type=recovery`. The bug is purely client-side in `src/pages/ResetPassword.tsx`:

1. The Supabase client is created at module load with `detectSessionInUrl` defaulting to `true`. It **synchronously parses the hash, stores the session, and clears the hash from the URL** before any React component mounts.
2. By the time `ResetPassword` mounts and runs `if (window.location.hash.includes("type=recovery"))`, the hash is already gone → check fails.
3. The `PASSWORD_RECOVERY` event from `onAuthStateChange` only fires once at the moment the URL is processed. Late subscribers (mounted after parsing) receive `INITIAL_SESSION`, never `PASSWORD_RECOVERY` → that check also fails.
4. Result: `isRecovery` stays `false` and the "Invalid Reset Link" screen is shown — even though the user is now actually authenticated with a recovery session.

## Fix

Rework recovery detection in `src/pages/ResetPassword.tsx` so it doesn't depend on the hash still being present or on catching the `PASSWORD_RECOVERY` event in time:

1. **Capture the hash immediately at module load** in a small helper module (`src/lib/recoveryDetection.ts`) that runs before Supabase's `detectSessionInUrl` clears it. Export a boolean `cameFromRecoveryLink`.
2. In `ResetPassword`:
   - Treat the page as a valid recovery context if **any** of these is true:
     - `cameFromRecoveryLink === true` (hash captured pre-Supabase), OR
     - the `PASSWORD_RECOVERY` event fires, OR
     - on mount, `supabase.auth.getSession()` returns a session AND the user arrived directly at `/reset-password` from the email link (we already know this from #1).
   - Show a brief loading state while checking session, instead of immediately rendering "Invalid Reset Link".
3. Keep the "Invalid Reset Link" screen as a fallback only after we've confirmed there is **no session** and **no recovery indicator**.

After the password is updated successfully, sign the user out (`supabase.auth.signOut()`) before navigating to `/login` so they're forced to log in fresh with the new password (matches current toast copy).

## Files Changed

- **New**: `src/lib/recoveryDetection.ts` — tiny module that snapshots `window.location.hash` at import time and exports `cameFromRecoveryLink`.
- **Edit**: `src/main.tsx` — import the new module first, before anything that imports the Supabase client, so the hash is captured before Supabase parses it.
- **Edit**: `src/pages/ResetPassword.tsx` — new detection logic, loading state, sign out after successful update.

## Verification

1. Request a password reset for a business account.
2. Click the link in the email.
3. Expect: `/reset-password` shows the **new password form** (not "Invalid Reset Link").
4. Submit a new valid password → toast success → redirected to `/login`.
5. Log in with the new password → land on the business dashboard.
