// Delete the currently authenticated user account and all associated data.
// Requires the caller to have re-authenticated client-side (password verified
// via supabase.auth.signInWithPassword) immediately before invoking this fn.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let feedback: string | null = null;
    try {
      const body = await req.json();
      feedback = typeof body?.feedback === "string" ? body.feedback.slice(0, 500) : null;
    } catch (_) { /* no body */ }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const uid = user.id;

    // Business/trainer guard: block deletion if active paid Stripe subscription exists
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
      return new Response(
        JSON.stringify({
          error:
            "You have an active paid subscription. Please cancel it from the billing portal before deleting your account.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Best-effort delete of user-owned rows. Errors are swallowed so a single
    // table glitch doesn't strand the auth user.
    const tables: Array<{ table: string; col: string }> = [
      { table: "posts", col: "user_id" },
      { table: "comments", col: "user_id" },
      { table: "reactions", col: "user_id" },
      { table: "follows", col: "follower_id" },
      { table: "follows", col: "following_id" },
      { table: "follow_requests", col: "requester_id" },
      { table: "follow_requests", col: "target_id" },
      { table: "notifications", col: "recipient_id" },
      { table: "notifications", col: "actor_id" },
      { table: "food_logs", col: "user_id" },
      { table: "nutrition_goals", col: "user_id" },
      { table: "workout_logs", col: "user_id" },
      { table: "trainer_gallery", col: "trainer_id" },
      { table: "business_gallery", col: "business_id" },
      { table: "business_events", col: "business_id" },
      { table: "profile_views", col: "trainer_id" },
      { table: "leads", col: "trainer_id" },
      { table: "subscription_events", col: "trainer_id" },
      { table: "subscriptions", col: "trainer_id" },
      { table: "profiles", col: "id" },
    ];
    for (const { table, col } of tables) {
      await admin.from(table).delete().eq(col, uid);
    }

    if (feedback) {
      console.log(`[delete-account] feedback uid=${uid}: ${feedback}`);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
