import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  createStripeClient,
  getWebhookSecret,
} from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Map our internal lookup keys to FitExtremes plan codes in subscription_plans.code
const PRICE_TO_PLAN_CODE: Record<string, string> = {
  trainer_monthly: "monthly",   // existing trainer monthly plan code
  business_monthly: "monthly",  // shared monthly cycle; differentiation is via price
};

async function findPlanIdForPrice(_priceLookup: string): Promise<string | null> {
  // Best-effort: pick the active monthly plan; if the project has multiple, prefer one matching by code.
  const { data } = await supabase
    .from("subscription_plans")
    .select("id, code")
    .eq("is_active", true);
  if (!data?.length) return null;
  const code = PRICE_TO_PLAN_CODE[_priceLookup] ?? "monthly";
  return (data.find((p) => p.code === code) ?? data[0]).id;
}

async function upsertSubscriptionFromStripe(args: {
  env: StripeEnv;
  userId: string;
  stripeSubscription: any;
  priceLookup: string;
}) {
  const { env, userId, stripeSubscription, priceLookup } = args;

  const planId = await findPlanIdForPrice(priceLookup);
  if (!planId) {
    console.error("No subscription_plan found for", priceLookup);
    return;
  }

  const status = mapStripeStatus(stripeSubscription.status, stripeSubscription.cancel_at_period_end);
  const item = stripeSubscription.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? stripeSubscription.current_period_end;
  const endIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
  const startIso = stripeSubscription.start_date
    ? new Date(stripeSubscription.start_date * 1000).toISOString()
    : new Date().toISOString();
  const priceCents = item?.price?.unit_amount ?? 0;
  const currency = (item?.price?.currency ?? "cad").toUpperCase();

  // Find existing subscription for this user
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("trainer_id", userId)
    .maybeSingle();

  const payload = {
    trainer_id: userId,
    plan_id: planId,
    status,
    billing_cycle: "monthly",
    price_cents: priceCents,
    currency,
    start_date: startIso,
    end_date: endIso,
    next_billing_date: endIso,
    cancel_at_period_end: !!stripeSubscription.cancel_at_period_end,
    payment_provider: "stripe",
    stripe_customer_id: stripeSubscription.customer as string,
    stripe_subscription_id: stripeSubscription.id as string,
    stripe_price_id: priceLookup,
    environment: env,
    trial_used: true,
  };

  if (existing) {
    await supabase.from("subscriptions").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("subscriptions").insert(payload);
  }

  await supabase.from("subscription_events").insert({
    trainer_id: userId,
    subscription_id: existing?.id ?? null,
    event_type: stripeSubscription.cancel_at_period_end ? "cancel_requested" : "subscribed",
    to_status: status,
    metadata: { stripe_event: true, env, price: priceLookup },
  });
}

function mapStripeStatus(stripeStatus: string, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd && (stripeStatus === "active" || stripeStatus === "trialing")) {
    return "active"; // still active until period end; cancel_at_period_end flag captures intent
  }
  switch (stripeStatus) {
    case "trialing": return "trial";
    case "active": return "active";
    case "past_due": return "payment_due";
    case "unpaid": return "grace";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    case "incomplete":
    case "paused":
      return "payment_due";
    default: return "active";
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const envParam = url.searchParams.get("env");
  const env: StripeEnv = envParam === "live" ? "live" : "sandbox";

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  const stripe = createStripeClient(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      getWebhookSecret(env),
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const obj: any = event.data.object;
        let subscription = obj;
        if (event.type === "checkout.session.completed") {
          if (!obj.subscription) break;
          subscription = await stripe.subscriptions.retrieve(obj.subscription as string);
        }
        const userId = subscription.metadata?.userId
          ?? (await stripe.customers.retrieve(subscription.customer as string) as any)?.metadata?.userId;
        if (!userId) {
          console.warn("No userId on subscription", subscription.id);
          break;
        }
        const item = subscription.items?.data?.[0];
        const priceLookup = item?.price?.lookup_key
          ?? subscription.metadata?.priceId
          ?? "trainer_monthly";
        await upsertSubscriptionFromStripe({ env, userId, stripeSubscription: subscription, priceLookup });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;
        const { data: row } = await supabase
          .from("subscriptions")
          .select("id, trainer_id")
          .eq("stripe_subscription_id", subscription.id)
          .eq("environment", env)
          .maybeSingle();
        if (row) {
          await supabase.from("subscriptions")
            .update({ status: "cancelled", cancel_at_period_end: false })
            .eq("id", row.id);
          await supabase.from("subscription_events").insert({
            trainer_id: row.trainer_id, subscription_id: row.id,
            event_type: "cancelled", to_status: "cancelled",
            metadata: { stripe_event: true, env },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice: any = event.data.object;
        const subId = invoice.subscription as string | undefined;
        if (!subId) break;
        const { data: row } = await supabase
          .from("subscriptions").select("id, trainer_id")
          .eq("stripe_subscription_id", subId).eq("environment", env).maybeSingle();
        if (row) {
          await supabase.from("subscriptions").update({ status: "payment_due" }).eq("id", row.id);
          await supabase.from("subscription_events").insert({
            trainer_id: row.trainer_id, subscription_id: row.id,
            event_type: "payment_failed", to_status: "payment_due",
            metadata: { stripe_event: true, env },
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice: any = event.data.object;
        const subId = invoice.subscription as string | undefined;
        if (!subId) break;
        const { data: row } = await supabase
          .from("subscriptions").select("id, trainer_id")
          .eq("stripe_subscription_id", subId).eq("environment", env).maybeSingle();
        if (row) {
          await supabase.from("subscription_events").insert({
            trainer_id: row.trainer_id, subscription_id: row.id,
            event_type: "payment_succeeded", to_status: "active",
            metadata: { stripe_event: true, env },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
