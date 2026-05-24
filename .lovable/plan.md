## Remove All Lovable Branding & Debug Tools from Production

### 1. Hide the "Edit with Lovable" badge on published deployments
- Call `publish_settings--set_badge_visibility` with `hide_badge: true`
- This removes the floating "Edit with Lovable" button from the live site

### 2. Clean up `index.html` (white-label meta tags)
- Remove `meta name="author" content="Lovable"`
- Remove `twitter:site="@Lovable"`
- Remove TODO comments
- Keep all other meta tags (og:title, og:description, og:image, twitter tags without Lovable references)

### 3. Remove Lovable docs links from production components
- **PaymentTestModeBanner.tsx**: Replace the `docs.lovable.dev` link with an internal or generic explanation, or remove the external link entirely
- **StripeTestCardsHelper.tsx**: Already links to `docs.stripe.com` — no Lovable branding, keep as-is

### 4. Update Capacitor mobile config for custom domain
- **capacitor.config.ts**: Change `server.url` from `https://87825c93-ae86-464c-a3a1-cc5c52812560.lovableproject.com?forceHideBadge=true` to `https://fitextremes.com?forceHideBadge=true`
- This ensures Android/iOS webviews load the white-labeled custom domain instead of the Lovable project URL

### 5. Ensure `lovable-tagger` never runs in production
- **vite.config.ts**: Already gated by `mode === "development"` — verify the conditional is correct (it is). No code change needed unless the user wants the dependency fully removed.

### 6. Update `.env` / environment variables if needed
- Check if `VITE_SUPABASE_URL` or other env vars reference Lovable URLs — they should already be correct

### 7. Publish after cleanup
- Republish the project so the badge removal and `index.html` changes go live

### 8. Validate
- Verify badge is hidden on `https://fitextremes.com`
- Verify no Lovable references in page source (view-source)
- Confirm mobile webviews load `fitextremes.com`

### What stays untouched
- Authentication flows (AuthContext, Supabase client)
- Stripe checkout and payment integrations
- All dashboard pages (business, trainer, social)
- All business logic, hooks, and API calls
- `forceHideBadge=true` query param (still needed to suppress badge in capacitor webview)
