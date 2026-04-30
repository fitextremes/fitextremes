import { motion } from "framer-motion";
import { Calendar, Sparkles, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMySubscription, daysBetween } from "@/hooks/useSubscription";

const PLAN_NAME = "Personal Trainer Plan";
const PLAN_PRICE = "$20/month";

const SubscriptionCard = () => {
  const { data: sub, isLoading } = useMySubscription();

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse h-40" />;
  }
  if (!sub) return null;

  const isTrial = sub.status === "trial" || sub.status === "trial_ending";
  const daysLeft = Math.max(0, daysBetween(sub.end_date));
  const isExpired = sub.status === "expired" || sub.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="flex items-start justify-between gap-4 flex-wrap relative">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" /> Subscription
          </p>
          <h3 className="font-display text-2xl text-foreground mt-1">{PLAN_NAME}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{PLAN_PRICE}</p>
        </div>
        {isTrial ? (
          <Badge className="border bg-primary/15 text-primary border-primary/40 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Free Trial
          </Badge>
        ) : isExpired ? (
          <Badge className="border bg-destructive/15 text-destructive border-destructive/40">Expired</Badge>
        ) : (
          <Badge className="border bg-primary/15 text-primary border-primary/40 flex items-center gap-1.5">
            <BadgeCheck className="h-3 w-3" /> Active Subscription
          </Badge>
        )}
      </div>

      <div className="mt-5 relative">
        {isTrial ? (
          <div className="rounded-xl bg-secondary/40 border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trial Status</p>
            <p className="font-display text-xl text-foreground mt-1">
              Free Trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You'll be charged {PLAN_PRICE} starting{" "}
              {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "soon"}.
            </p>
          </div>
        ) : isExpired ? (
          <div className="rounded-xl bg-secondary/40 border border-border p-4">
            <p className="text-sm text-destructive">
              Your plan has expired. Contact support to reactivate.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-secondary/40 border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Next Billing Date
            </p>
            <p className="font-display text-xl text-foreground mt-1">
              {sub.next_billing_date || sub.end_date
                ? new Date((sub.next_billing_date || sub.end_date)!).toLocaleDateString()
                : "—"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;
