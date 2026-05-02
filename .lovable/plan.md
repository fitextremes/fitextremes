# Fix 404 after Business signup

After a Business user signs up, the app redirects to `/business-dashboard`, but that route is not registered in `src/App.tsx` — only `/trainer-dashboard` exists. React Router falls through to the catch-all `*` route, which renders `NotFound`.

The page components already exist (`BusinessDashboard.tsx`, `BusinessEditProfile.tsx`, `BusinessGallery.tsx`, `BusinessPublicProfile.tsx`) but are not wired into the router.

## Changes

**`src/App.tsx`** — add imports and route entries:

- Import `BusinessDashboard`, `BusinessEditProfile`, `BusinessGallery`, `BusinessPublicProfile`.
- Add the following routes (placed above the `*` catch-all):
  - `/business-dashboard` → `BusinessDashboard`
  - `/business/edit` → `BusinessEditProfile`
  - `/business/gallery` → `BusinessGallery`
  - `/business/:id` already exists for `BusinessProfile`; keep it. Public profile by username/handle gets `/b/:identifier` → `BusinessPublicProfile` (only if referenced elsewhere — otherwise skip).

Minimum required to fix the reported 404 is just `/business-dashboard`. The other business routes are added at the same time so internal links from the dashboard (Edit profile, Gallery) don't 404 next.

No other files need changes.
