// Delete the currently authenticated user account and all associated data.
// Requires the caller to have re-authenticated client-side (password verified
// via supabase.auth.signInWithPassword) immediately before invoking this fn.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      console.error("[delete-account] auth.getUser failed", userErr);
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
    const uid = user.id;
    console.log(`[delete-account] starting deletion for uid=${uid}`);

    // Guard: block deletion if active paid Stripe subscription exists
    const { data: sub } = await admin
      .from("subscriptions")
      .select("status, payment_provider, stripe_subscription_id, cancel_at_period_end")
      .eq("trainer_id", uid)
      .maybeSingle();

    if (
      sub &&
      sub.payment_provider === "stripe" &&
      sub.stripe_subscription_id &&
      ["active", "trialing", "past_due", "payment_due"].includes(sub.status) &&
      !sub.cancel_at_period_end
    ) {
      return json({
        error:
          "You have an active paid subscription. Please cancel it from the billing portal before deleting your account.",
      }, 409);
    }

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
      const { error } = await admin.from(table).delete().eq(col, uid);
      if (error) {
        console.warn(`[delete-account] delete ${table}.${col} failed:`, error.message);
      }
    }

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
