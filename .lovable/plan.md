## Plan

1. Fix the actual blocker: email delivery setup
- The signup flow itself is succeeding, but the project currently has no sender domain configured for email delivery.
- Set up the project’s email sending domain in Lovable Cloud so confirmation emails can be sent reliably to Gmail and other inboxes.
- If the business already has a domain, use that. If not, connect or purchase one first in the project’s domain/email settings.

2. Turn on proper confirmation-email handling for this app
- Set up the app’s built-in authentication email flow so account confirmation emails are sent from the project instead of relying on the current incomplete setup.
- Add branded auth email templates that match FitExtremes so users recognize the message and are more likely to open it.
- Keep the email body on a white background for deliverability and readability.

3. Keep the improved signup UX and tighten the resend flow
- Preserve the current “check your email” state after business signup.
- Make sure existing unconfirmed accounts are guided to resend the confirmation email instead of repeatedly attempting signup.
- Ensure business login continues to show a clear “confirm your email first” message with resend support.

4. Handle already-created unconfirmed business accounts correctly
- The auth logs show a repeated-signup event for the same Gmail address, which means the account already exists but is still unconfirmed.
- After email delivery is fixed, verify that the existing business owner can use resend confirmation, confirm the email, then sign in normally.
- Prevent the user from being trapped in a loop of creating the same account again.

5. Verify the full business flow end-to-end
- Test with a fresh business signup and confirm that the email is actually received.
- Test the existing unconfirmed Gmail account by resending the confirmation email and completing confirmation.
- Confirm the user can then log in and land on `/business-dashboard` without being sent to `/business` or a 404.

## What I found
- The backend is accepting the requests: recent auth logs show both `/signup` and `/resend` returning `200`.
- The auth logs also show a `user_repeated_signup` event, which means the Gmail address already has an unconfirmed account.
- This workspace currently has no email domain configured, and the project also has no custom domain configured.
- There is no auth email template/hook setup in the repo yet.
- The UI fixes for pending confirmation and resend are present, but email delivery itself is still not fully configured.

## Technical details
- Backend/email work: configure the project email domain, scaffold auth email templates, and activate the auth email hook.
- Frontend work: keep using the current `Signup.tsx`, `Login.tsx`, and `AuthContext.tsx` confirmation/resend flow, only adjusting if testing reveals edge cases.
- Validation: test both a brand-new business account and the already-created unconfirmed business Gmail account.

## Expected outcome
After this fix:
1. business signup creates the account,
2. a confirmation email is actually delivered,
3. the user confirms the email,
4. the user logs in successfully,
5. the user lands in the business dashboard without routing errors.