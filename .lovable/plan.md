## Plan

1. Reproduce and trace the failing deletion path end-to-end.
   - Verify the trainer delete flow from the existing `DeleteAccountDialog` entry point used by `TrainerEditProfile`.
   - Check whether the backend function is actually being reached, and whether the failure happens before invocation, during password re-authentication, or inside the account-removal sequence.
   - Validate the trainer-specific path, including users with subscription records, gallery assets, posts, and related activity.

2. Harden the backend deletion flow for trainer accounts.
   - Fix the `delete-account` backend function so it reliably authenticates the caller, handles trainer-related records safely, and removes the auth account last.
   - Make the deletion flow resilient to partial cleanup issues by treating non-critical cleanup as best effort while still guaranteeing account removal when allowed.
   - Review trainer subscription handling so active billing states return a clear, deterministic response instead of failing silently or leaving the UI stuck.

3. Harden the client deletion UX so it cannot get stuck.
   - Update `DeleteAccountDialog` to handle every backend outcome explicitly: success, blocked deletion, expired session, password verification failure, and unexpected errors.
   - Ensure loading state always resets, duplicate submits are prevented, and successful deletion always clears local auth state and redirects cleanly on web and mobile.
   - Add better error surfacing so trainers see the actual reason deletion is blocked instead of a generic failed flow.

4. Validate the fixed flow across the required scenarios.
   - Test trainer deletion for normal accounts and edge cases: newly registered trainers, old accounts, accounts with gallery uploads, posts, followers, and subscription rows.
   - Confirm the result is consistent after refresh, app reopen, and slow-session conditions.
   - Verify the final state: account removed, session cleared, redirect works, and login is no longer possible.

## Technical details

- Files likely involved:
  - `src/components/DeleteAccountDialog.tsx`
  - `src/pages/TrainerEditProfile.tsx`
  - `supabase/functions/delete-account/index.ts`
- Main focus:
  - backend invocation reliability
  - trainer-specific cleanup coverage
  - session/logout cleanup after deletion
  - explicit error handling for blocked deletions and failed re-auth

## Expected result

After the fix, a Personal Trainer can complete:
- Delete Account
- Continue
- Verify Password
- Final confirmation

…and the account is permanently removed, the user is logged out, redirected safely, and cannot sign back in.