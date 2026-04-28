import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Sparkles, Calendar, Clock } from "lucide-react";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useSubscriptionPlans, useMySubscription, useSubscribeToPlan,
  useSubscriptionEvents, STATUS_META, formatPrice,
} from "@/hooks/useSubscription";

const eventLabel: Record<string, string> = {
  trial_started: "Trial started",
  trial_ending_soon: "Trial ending soon",
  subscribed: "Subscribed to plan",
  renewed: "Subscription renewed",
  payment_failed: "Payment failed",
  payment_succeeded: "Payment succeeded",
  cancel_requested: "Cancellation scheduled",
  cancelled: "Subscription cancelled",
  reactivated: "Subscription reactivated",
  expired: "Subscription expired",
  plan_changed: "Plan changed",
};

const TrainerBilling = () => {
  const { user, loading: authLoading } = useAuth();
  const { isTrainer, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plans } = useSubscriptionPlans();
  const { data: sub } = useMySubscription();
  const { data: events } = useSubscriptionEvents();
  const subscribe = useSubscribeToPlan();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?role=trainer");
  }, [authLoading, user, navigate]);
  useEffect(() => {
    if (!roleLoading && user && !isTrainer) navigate("/dashboard");
  }, [roleLoading, isTrainer, user, navigate]);

  const onPick = async (code: string) => {
    if (code === "enterprise") {
      window.location.href = "mailto:sales@fitextremes.com?subject=Enterprise%20plan";
      return;
    }
    try {
      const res = await subscribe.mutateAsync(code);
      if (!res.ok) throw new Error(res.reason || "Failed");
      toast({ title: "Subscription activated", description: "Mock billing — no real charge." });
    } catch (e: any) {
      toast({ title: "Could not subscribe", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <SocialTopBar title="Profile" />
      <div className="container mx-auto px-4 pt-20 max-w-5xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/trainer-dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>

        {sub && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Plan</p>
                <h2 className="font-display text-2xl text-foreground">{sub.plan.name}</h2>
                {sub.end_date && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Renews {new Date(sub.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge className={`border ${STATUS_META[sub.status].tone}`}>{STATUS_META[sub.status].label}</Badge>
            </div>
          </motion.div>
        )}

        {/* Plans */}
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider mb-4 text-foreground">
            <Sparkles className="inline h-5 w-5 text-primary mr-2" /> Choose Your Plan
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans?.filter(p => !p.is_default_trial).map((p, i) => {
              const isCurrent = sub?.plan.code === p.code && (sub.status === "active" || sub.status === "trial_ending");
              const savings = p.code === "annual";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl border-2 p-5 bg-card shadow-card flex flex-col ${
                    p.code === "pro" ? "border-primary" : "border-border"
                  }`}
                >
                  {p.code === "pro" && (
                    <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">Most Popular</Badge>
                  )}
                  {savings && (
                    <Badge className="absolute -top-2 right-4 bg-accent text-accent-foreground">Save 14%</Badge>
                  )}
                  <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{p.description}</p>
                  <p className="font-display text-3xl text-primary mt-3">
                    {p.billing_cycle === "custom" ? "Custom" : formatPrice(p.price_cents, p.currency)}
                    {p.billing_cycle !== "custom" && (
                      <span className="text-xs text-muted-foreground font-sans"> /{p.billing_cycle === "annual" ? "yr" : "mo"}</span>
                    )}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-foreground/90 flex-1">
                    <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-1 text-primary shrink-0" /> Unlimited leads</li>
                    <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-1 text-primary shrink-0" /> Public profile & gallery</li>
                    {(p.code === "pro" || p.code === "annual" || p.code === "enterprise") && (
                      <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-1 text-primary shrink-0" /> Priority Discover ranking</li>
                    )}
                    {p.code === "enterprise" && (
                      <li className="flex items-start gap-2"><Check className="h-3 w-3 mt-1 text-primary shrink-0" /> Dedicated account manager</li>
                    )}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    variant={isCurrent ? "outline" : "hero"}
                    disabled={isCurrent || subscribe.isPending}
                    onClick={() => onPick(p.code)}
                  >
                    {isCurrent ? "Current Plan" : p.code === "enterprise" ? "Contact Sales" : "Choose Plan"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Billing History
          </h2>
          {!events?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No billing activity yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e: any) => (
                <li key={e.id} className="py-3 flex justify-between items-center text-sm">
                  <span className="text-foreground">{eventLabel[e.event_type] || e.event_type}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
      <MobileTabBar />
    </div>
  );
};

export default TrainerBilling;
