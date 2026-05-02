## Plan

Delete the unconfirmed business account `rgvirk19@gmail.com` from the auth system so that email can be re-registered and auto-logged-in under the new "no email confirmation required" setup.

### What will happen
- Run a database migration that removes the user from `auth.users` (cascades to `public.profiles`, `subscriptions`, etc. via existing FKs).
- After deletion, the business owner can sign up again with the same Gmail address and will be taken straight into the business dashboard (email confirmation is now disabled).

### SQL
```sql
DELETE FROM auth.users WHERE lower(email) = 'rgvirk19@gmail.com';
```

### Verification
- Confirm the user no longer exists in `auth.users` and `public.profiles`.
- Sign up again with that email and confirm immediate redirect to `/business-dashboard`.