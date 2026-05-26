// Delete the currently authenticated user account and all associated data.
// Requires the caller to have re-authenticated client-side (password verified
// via supabase.auth.signInWithPassword) immediately before invoking this fn.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ACTIVE_SUBSCRIPTION_STATUSES = ["trial", "trial_ending", "active", "payment_due", "grace", "past_due"];

async function deleteRows(admin: ReturnType<typeof createClient>, table: string, column: string, userId: string) {
  const { error } = await admin.from(table).delete().eq(column, userId);
  if (error) {
    console.warn(`[delete-account] delete ${table}.${column} failed:`, error.message);
  }
}

async function cancelStripeSubscriptionIfNeeded(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("id, status, payment_provider, stripe_subscription_id, cancel_at_period_end, environment")
    .eq("trainer_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[delete-account] failed to inspect subscription:", error.message);
    throw new Error("Unable to verify subscription status before deletion.");
  }

  if (!sub || sub.payment_provider !== "stripe" || !sub.stripe_subscription_id) {
    return;
  }

  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status)) {
    return;
  }

  const env = (sub.environment === "live" ? "live" : "sandbox") as StripeEnv;
  console.log(`[delete-account] cancelling stripe subscription ${sub.stripe_subscription_id} in ${env}`);
  try {
    const stripe = createStripeClient(env);
    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    await admin
      .from("subscriptions")
      .update({ status: "cancelled", cancel_at_period_end: false })
      .eq("id", sub.id);
  } catch (stripeError) {
    console.error("[delete-account] stripe cancellation failed:", stripeError);
    throw new Error("We couldn't cancel your active subscription automatically. Please try again in a moment.");
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error("[delete-account] missing auth header");
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    const uid = claimsData?.claims?.sub;
    if (claimsError || !uid) {
      console.error("[delete-account] auth.getClaims failed", claimsError);
      return json({ error: "Unauthorized" }, 401);
    }

    let feedback: string | null = null;
    try {
      const body = await req.json();
      feedback = typeof body?.feedback === "string" ? body.feedback.slice(0, 500) : null;
    } catch (_) { /* no body */ }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.log(`[delete-account] starting deletion for uid=${uid}`);

    await cancelStripeSubscriptionIfNeeded(admin, uid);

    // Best-effort delete of user-owned rows. Each failure is logged but does
    // not abort — so a single missing table/column never strands the auth user.
    const tables: Array<{ table: string; col: string }> = [
      { table: "comments", col: "user_id" },
      { table: "reactions", col: "user_id" },
      { table: "follows", col: "follower_id" },
      { table: "follows", col: "following_id" },
      { table: "follow_requests", col: "requester_id" },
      { table: "follow_requests", col: "target_id" },
      { table: "connection_requests", col: "sender_id" },
      { table: "notifications", col: "recipient_id" },
      { table: "notifications", col: "actor_id" },
      { table: "posts", col: "user_id" },
      { table: "food_logs", col: "user_id" },
      { table: "nutrition_goals", col: "user_id" },
      { table: "workout_logs", col: "user_id" },
      { table: "trainer_gallery", col: "trainer_id" },
      { table: "business_gallery", col: "business_id" },
      { table: "business_events", col: "business_id" },
      { table: "profile_views", col: "trainer_id" },
      { table: "profile_views", col: "viewer_id" },
      { table: "leads", col: "trainer_id" },
      { table: "leads", col: "sender_id" },
      { table: "subscription_events", col: "trainer_id" },
      { table: "subscriptions", col: "trainer_id" },
      { table: "profiles", col: "id" },
    ];
    for (const { table, col } of tables) {
      await deleteRows(admin, table, col, uid);
    }

    await deleteRows(admin, "connection_requests", "target_id", uid);

    // Best-effort: remove uploaded storage assets in user-scoped folders.
    for (const bucket of ["avatars", "post-images", "trainer-gallery", "business-gallery"]) {
      try {
        const { data: files } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
        if (files && files.length) {
          const paths = files.map((f) => `${uid}/${f.name}`);
          await admin.storage.from(bucket).remove(paths);
        }
      } catch (e) {
        console.warn(`[delete-account] storage cleanup ${bucket} failed:`, (e as Error).message);
      }
    }

    if (feedback) {
      console.log(`[delete-account] feedback uid=${uid}: ${feedback}`);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      console.error("[delete-account] auth.admin.deleteUser failed:", delErr);
      return json({ error: delErr.message || "Failed to delete auth user" }, 500);
    }

    console.log(`[delete-account] completed uid=${uid}`);
    return json({ ok: true });
  } catch (e) {
    console.error("[delete-account] unhandled error:", e);
    return json({ error: (e as Error).message || "Unexpected error" }, 500);
  }
});
