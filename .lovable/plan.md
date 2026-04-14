
Goal: fix the failed Supabase SQL/backfill and align the app so any of the 3 user roles can log in with either email or username.

What I found
- The current frontend sends `full_name`, `role`, and `username` in auth signup metadata.
- Login already tries username lookup from `public.profiles`.
- Your `profiles` table clearly has extra columns including `full_name`, and `full_name` is `NOT NULL`.
- The earlier SQL failed because it inserted only `(id, email, username, role)` into `profiles`, so existing/new rows hit the `full_name` constraint.

Plan

1. Fix the Supabase SQL to match the real `profiles` schema
- Provide a corrected SQL script that:
  - safely recreates the trigger function
  - inserts `full_name` as well as `email`, `username`, and `role`
  - uses metadata fallbacks so rows never violate `NOT NULL`
- Backfill existing auth users into `public.profiles` with:
  - `full_name` from `raw_user_meta_data->>'full_name'`
  - fallback to `raw_user_meta_data->>'username'`
  - fallback to email
- Use `ON CONFLICT (id)` logic so rerunning is safe.

2. Make profile creation robust for future signups
- Update the trigger logic so every new `auth.users` row automatically creates/updates a matching `profiles` row.
- Ensure `role` defaults to `user` if metadata is missing.
- Ensure `username` is still copied when available.

3. Align app signup with the login requirement
- Right now only Social User collects a username.
- Since you want all 3 roles to log in with email or username, update signup so Trainer and Business users also provide a username.
- Make username mandatory for all roles, not just Social User.

4. Keep validation consistent across roles
- Reuse the existing username validation rules for all three roles.
- Keep full name, email, and password mandatory.
- Preserve the current real-time validation, password strength, and show/hide password UX.

5. Verify the full auth flow end to end
- Test these scenarios after implementation:
  - Social User signup creates auth user + profile row
  - Trainer signup creates auth user + profile row
  - Business signup creates auth user + profile row
  - Login with email works
  - Login with username works
  - Existing backfilled users can log in by username if they have one in metadata/profile
- If some existing users have no username in auth metadata, note that they may need a one-time manual username update before username login works.

Technical details
```text
Current mismatch:
frontend signup metadata -> full_name, role, username
profiles table -> full_name is required
old SQL insert -> id, email, username, role only
result -> trigger/backfill fails with full_name NULL
```

Expected DB behavior after fix:
```text
auth.users created
  -> trigger runs
  -> insert into profiles:
     id
     email
     full_name  (required, with fallback)
     username
     role
     created_at/defaults
```

Implementation output
- A corrected SQL block for Supabase SQL Editor
- Frontend plan to update `Signup.tsx` so username is required for all roles
- Final verification checklist for signup + login by email/username
