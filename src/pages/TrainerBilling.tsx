import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, BadgeCheck, Sparkles } from "lucide-react";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import SubscriptionCard from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionEvents } from "@/hooks/useSubscription";

const eventLabel: Record<string, string> = {
  trial_started: "Trial started",
  trial_ending_soon: "Trial ending soon",
  subscribed: "Subscribed",
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
  const { data: events } = useSubscriptionEvents();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?role=trainer");
  }, [authLoading, user, navigate]);
  useEffect(() => {
    if (!roleLoading && user && !isTrainer) navigate("/dashboard");
  }, [roleLoading, isTrainer, user, navigate]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <SocialTopBar title="Profile" />
      <div className="container mx-auto px-4 pt-20 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/trainer-dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>

        <SubscriptionCard />

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> What's Included
          </h2>
          <ul className="space-y-2 text-sm text-foreground/90">
            <li className="flex items-start gap-2"><BadgeCheck className="h-4 w-4 text-primary mt-0.5" /> Unlimited leads from clients</li>
            <li className="flex items-start gap-2"><BadgeCheck className="h-4 w-4 text-primary mt-0.5" /> Public profile & photo gallery</li>
            <li className="flex items-start gap-2"><BadgeCheck className="h-4 w-4 text-primary mt-0.5" /> Discover ranking & visibility</li>
            <li className="flex items-start gap-2"><BadgeCheck className="h-4 w-4 text-primary mt-0.5" /> 30 days free, then $20/month</li>
          </ul>
        </motion.div>

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
