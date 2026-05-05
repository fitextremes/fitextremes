// Capture recovery indicators from the URL BEFORE the Supabase client is
// imported/initialized. The Supabase client (with detectSessionInUrl: true)
// synchronously parses and clears the hash on creation, so by the time
// React components mount, window.location.hash is already empty.
//
// This module must be imported in main.tsx before any module that imports
// the Supabase client.

const initialHash = typeof window !== "undefined" ? window.location.hash : "";
const initialSearch = typeof window !== "undefined" ? window.location.search : "";
const initialPath = typeof window !== "undefined" ? window.location.pathname : "";

export const cameFromRecoveryLink =
  initialHash.includes("type=recovery") ||
  initialSearch.includes("type=recovery") ||
  // PKCE / code flow lands on /reset-password with a `?code=...` query param
  (initialPath === "/reset-password" && initialSearch.includes("code="));
