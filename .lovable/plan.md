## Plan

1. Enable proper signup email delivery for the app
- Configure the project’s email sending domain in Lovable Cloud, since no sender domain is currently set up for this workspace.
- Set up the built-in auth email flow so confirmation, password reset, and related auth emails can be sent reliably from FitExtremes.
- Apply FitExtremes branding to the auth emails so the confirmation email clearly looks legitimate and is easier for users to trust/open.

2. Fix the business signup post-submit experience
- Update the business signup flow so it treats “account created but email not yet confirmed” as a first-class state instead of sending the user into a confusing dead end.
- Keep the user on a clear confirmation screen after signup with messaging like “Check your email to verify your account before signing in.”
- Show the email address used for signup, explain spam/junk-folder checks, and provide a path back to login.

3. Add resend-confirmation support
- Add a “Resend confirmation email” action for newly registered but unconfirmed users.
- Also surface the same resend option on the business login screen when a user tries to sign in before confirming.
- Handle success and failure states with clear messages so users know whether a fresh confirmation email was sent.

4. Improve unconfirmed-login handling
- Detect the backend response for unconfirmed accounts and replace the generic “Invalid login credentials” toast with a specific message explaining that email verification is still required.
- Route users to the confirmation helper state instead of leaving them stuck on the login form.

5. Remove/align duplicate business auth logic
- Review the unused `BusinessAuth.tsx` flow and either wire it correctly or retire its conflicting logic so the app has one consistent business signup/login experience.
- Ensure there is no path that navigates business users straight to the dashboard before confirmation when no active session exists.

6. Verify the full flow end-to-end
- Test this sequence with a fresh business account: signup → confirmation email received → email confirmed → login → land on `/business-dashboard`.
- Verify there is no redirect to `/business`, no 404, and no generic invalid-credentials message for unconfirmed users.

## What I found
- The signup request is succeeding and returning `confirmation_sent_at`, which means the backend is creating the account in a confirmation-required state.
- Immediate login then fails with `invalid_credentials`, which is consistent with trying to sign in before email confirmation.
- There is currently no email domain configured for this project/workspace, and there are no auth email template functions in the repo yet.
- The current UI tells users to check their email, but it does not provide a proper confirmation screen or resend-confirmation flow.
- There is also an older `BusinessAuth.tsx` file with conflicting behavior that navigates directly to the dashboard after signup, even though that screen is not currently routed.

## Technical details
- Update the signup/login UI in `src/pages/Signup.tsx` and `src/pages/Login.tsx` to handle unconfirmed users explicitly.
- Extend `src/contexts/AuthContext.tsx` with resend-confirmation support using the auth client.
- Set up Lovable Cloud auth email delivery and scaffold branded auth email templates.
- Keep the existing route fixes in `src/App.tsx`, `src/pages/BusinessDashboard.tsx`, and `src/pages/BusinessEditProfile.tsx` intact so confirmed business users land on `/business-dashboard`.
- Clean up or align `src/pages/BusinessAuth.tsx` so only one business auth flow exists.

## Expected outcome
After implementation, a business owner will:
1. sign up,
2. receive a FitExtremes confirmation email,
3. confirm their email,
4. sign in successfully,
5. land in the business dashboard without hitting `/business` or a 404.