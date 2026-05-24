import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ALLOWED_RETURN_ORIGINS = new Set([
  "https://fitextremes.com",
  "https://www.fitextremes.com",
  "https://fitextremes.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
]);

function isAllowedReturnUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (ALLOWED_RETURN_ORIGINS.has(u.origin)) return true;
    if (u.origin.endsWith(".lovable.app") || u.origin.endsWith(".lovableproject.com")) return true;
    return false;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { returnUrl, environment } = (await req.json()) as {
      returnUrl?: string; environment?: StripeEnv;
    };
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");
    if (!returnUrl || !isAllowedReturnUrl(returnUrl)) throw new Error("Invalid returnUrl");

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user's Stripe customer id from the subscriptions table for this env
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("trainer_id", user.id)
      .eq("environment", environment)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id as string | undefined;

    const stripe = createStripeClient(environment);

    // Fallback: search Stripe by userId metadata
    if (!customerId) {
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${user.id}'`,
        limit: 1,
      });
      customerId = found.data[0]?.id;
    }

    if (!customerId) {
      return new Response(JSON.stringify({ error: "No Stripe customer found. Subscribe first." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
