## Why "Kahma Supplements" doesn't appear

The Discover page (`src/pages/Discover.tsx`) currently shows **hardcoded mock data** for the Gyms and Supplement Stores tabs:

- `mockGyms` — static array
- `mockSupplements` — static array (NutriMax, Protein Planet, Vitality Health, MuscleFuel)
- Only the Trainers tab fetches real data (via `useTrainerList`)

Kahma Supplements **is** in the database:
- `role = "business"`, `business_type = "supplement_store"`, `is_suspended = false`
- It just has no code path that loads it into the Supplement Stores tab.

## Plan

### 1. Use the existing `useBusinessList` hook

`src/hooks/useBusiness.ts` already exposes `useBusinessList()` which fetches all non-suspended business profiles, including `business_type`. No new hook needed.

### 2. Update `src/pages/Discover.tsx`

- Import and call `useBusinessList()`.
- Build two derived arrays merging real businesses (filtered by `business_type`) with the existing mocks, mirroring the pattern already used for trainers:
  - **Gyms tab**: real businesses where `business_type === "gym"` + `mockGyms`
  - **Supplements tab**: real businesses where `business_type` is `"supplement_store"` (and tolerate variants like `"supplements"`) + `mockSupplements`
- Each real item maps to: `{ id, isReal: true, name: full_name, location: location || "Canada", rating: 5.0, type: bio?.slice(0,60) || default label, image: emoji, avatar_url }`.
- Keep the search + location filter logic identical; just run it over the merged list.
- "View Profile" link: for real businesses, route to `/business/{id}` (already supported by `BusinessPublicProfile`); mocks keep current behavior.

### 3. Verification

- Switch to Supplement Stores tab on `/discover` → "Kahma Supplements" appears alongside the mocks, with its avatar (if set) and Toronto/etc location.
- Click "View Profile" on Kahma → opens its public business profile.
- Gyms tab also shows any business with `business_type = "gym"`.
- Search/location filters still work on the merged list.

### Files to edit

- `src/pages/Discover.tsx` (only file)

No DB changes, no new hooks, no schema migration.