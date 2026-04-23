
Goal: fix the private Social-user follow-request flow so Accept/Decline works reliably on web and mobile, and stop the repeated failed attempts.

What is actually broken
- The current Accept action is being done from the client in `src/hooks/useFollowRequest.ts`.
- On Accept, the logged-in private user tries to:
  1. insert into `follows` with `follower_id = requesterId`
  2. delete the pending row from `follow_requests`
- Both operations conflict with the current database rules:
  - `follows` INSERT only allows `auth.uid() = follower_id`
  - `follow_requests` DELETE only allows the requester to delete their own request
- So the private target can see the request, but cannot securely approve it from the browser with the current RLS setup.
- There is also a secondary issue: notification items can outlive the real pending request, so the UI can still show Accept/Decline on stale notification rows.

Implementation plan

1. Move follow-request resolution into a secure backend function
- Add a database function via migration, e.g. `resolve_follow_request(_request_id uuid, _accept boolean)`.
- Make it validate all of this before changing data:
  - caller must be authenticated
  - caller must be the `target_id` of that pending request
  - request must still exist and still be `pending`
  - requester and target must both be Social users (`profiles.role = 'user'`)
- Function behavior:
  - If accept:
    - create `follows(requester_id -> target_id)` with conflict-safe logic
    - remove the pending request
    - remove receiver actionable notification
    - remove sender “request sent” notification
    - create sender “follow_request_accepted” notification
  - If decline:
    - remove the pending request
    - remove receiver actionable notification
    - remove sender “request sent” notification
    - create sender “follow_request_declined” notification
- Return a structured result so the client knows whether it was accepted, declined, already resolved, or invalid.
- Do not relax RLS to let the browser insert follows on someone else’s behalf.

2. Update client follow-request actions to use the backend function
- Refactor `src/hooks/useFollowRequest.ts` so `useRespondFollowRequest` calls the backend function instead of directly inserting/deleting rows from `follows` and `follow_requests`.
- Keep button loading state, but make it row-specific so one request does not disable unrelated actions.
- Surface clear error text:
  - “This request was already resolved”
  - “Could not complete action. Please try again.”
- Preserve existing query invalidation for:
  - `follow-requests-incoming`
  - `follow-state`
  - `followers`
  - `following`
  - `notifications`

3. Prevent stale notification cards from showing fake pending actions
- Update `src/hooks/useNotifications.ts` to enrich `follow_request_received` items with the live request state, or filter out notifications whose `follow_request_id` no longer points to a pending request.
- In `src/components/NotificationBell.tsx` and `src/pages/Notifications.tsx`:
  - only show Accept/Decline when the linked request is still pending
  - remove actionable styling for resolved/orphaned items
- This fixes the dead-button scenario caused by old notification rows.

4. Keep sender button state synchronized everywhere
- Keep `useFollowState` realtime invalidation, but make sure it reflects the backend resolution path.
- After Accept:
  - sender sees `Following`
  - private target sees updated follower count/list
- After Decline:
  - sender sees `Follow`
  - sender can re-request later
- Verify this across:
  - profile page
  - explore cards
  - follower/following lists
  - notification-driven flows

5. Fix notification behavior to match the requested Instagram-style flow
- Ensure the private user’s actionable notification disappears immediately after Accept/Decline.
- Ensure the sender gets the correct result notification.
- Keep everything under the single bell only.
- Optional cleanup: remove old orphaned `follow_request_received` rows already left in the table from failed attempts.

Files to change
- `src/hooks/useFollowRequest.ts`
- `src/hooks/useNotifications.ts`
- `src/components/NotificationBell.tsx`
- `src/pages/Notifications.tsx`
- `supabase/migrations/...` for the secure request-resolution function and any supporting SQL

Technical details
- Root cause is RLS, not just UI:
  - `follows` INSERT policy requires the authenticated user to equal `follower_id`
  - `follow_requests` DELETE policy only permits the requester
  - Accepting a request as the private target therefore fails in the current browser-side implementation
- Secure fix is a backend/database function that validates ownership and performs the multi-step mutation atomically.
- This approach also avoids race conditions, duplicate follow rows, and half-resolved notification states.

Validation after implementation
- Private user receives request with Accept/Decline.
- Accept creates follower relationship and removes pending card.
- Decline removes pending card and does not create relationship.
- Sender button changes:
  - Follow -> Requested -> Following on accept
  - Follow -> Requested -> Follow on decline
- Sender can send a new request after decline.
- No stale pending notification remains actionable.
