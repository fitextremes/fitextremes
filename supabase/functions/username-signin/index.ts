// Resolve a username to its email server-side and perform sign-in.
// Replaces the anon-callable lookup_email_by_username RPC, which leaked
// private user emails to unauthenticated callers.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { username, password } = await req.json() as {
      username?: string; password?: string;
    };
    if (!username || typeof username !== "string" || !password || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const normalized = username.trim().toLowerCase();
    if (normalized.length < 1 || normalized.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid username" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve email server-side using service role (never returned to client).
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .ilike("username", normalized)
      .maybeSingle();

    // Always return a generic error to avoid username enumeration.
    const genericError = () =>
      new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (!profile?.email) return genericError();

    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anon.auth.signInWithPassword({
      email: String(profile.email).toLowerCase(),
      password,
    });
    if (error || !data.session) return genericError();

    return new Response(JSON.stringify({ session: data.session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
