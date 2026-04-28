import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Sparkles, RefreshCw, XCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useMySubscription, useCancelSubscription, useReactivateSubscription,
  STATUS_META, daysBetween, formatPrice,
} from "@/hooks/useSubscription";

const SubscriptionCard = () => {
  const { data: sub, isLoading } = useMySubscription();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse h-40" />
    );
  }
  if (!sub) return null;

  const meta = STATUS_META[sub.status];
  const daysLeft = daysBetween(sub.end_date);
  const isExpired = sub.status === "expired" || sub.status === "cancelled";
  const isTrial = sub.status === "trial" || sub.status === "trial_ending";

  const onCancel = async () => {
    if (!confirm("Cancel subscription? You'll keep access until your billing period ends.")) return;
    try {
      await cancel.mutateAsync();
      toast({ title: "Cancellation scheduled", description: `Access ends ${new Date(sub.end_date!).toLocaleDateString()}` });
    } catch (e: any) {
      toast({ title: "Could not cancel", description: e.message, variant: "destructive" });
    }
  };

  const onReactivate = async () => {
    try {
      const res = await reactivate.mutateAsync();
      if ((res as any)?.reason === "choose_plan") {
        toast({ title: "Choose a plan", description: "Pick a plan to reactivate." });
      } else {
        toast({ title: "Subscription reactivated" });
      }
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

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
          <h3 className="font-display text-2xl text-foreground mt-1">{sub.plan.name}</h3>
          {sub.price_cents > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatPrice(sub.price_cents, sub.currency)} / {sub.billing_cycle === "annual" ? "year" : "month"}
            </p>
          )}
        </div>
        <Badge className={`border ${meta.tone} flex items-center gap-1.5`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} animate-pulse`} />
          {meta.label}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 relative">
        <div className="rounded-xl bg-secondary/40 border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {sub.cancel_at_period_end ? "Access Ends" : "Next Billing"}
          </p>
          <p className="font-display text-base text-foreground mt-1">
            {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/40 border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Days Remaining</p>
          <p className="font-display text-base text-foreground mt-1">
            {daysLeft > 0 ? `${daysLeft} days` : "0 days"}
          </p>
        </div>
      </div>

      {sub.cancel_at_period_end && !isExpired && (
        <p className="mt-3 text-xs text-accent">
          Cancellation scheduled — access ends {new Date(sub.end_date!).toLocaleDateString()}.
        </p>
      )}
      {isTrial && (
        <p className="mt-3 text-xs text-muted-foreground">
          Your free month is active. Add a plan before it ends to keep receiving leads.
        </p>
      )}
      {sub.status === "payment_due" && (
        <p className="mt-3 text-xs text-accent">
          We couldn't process your payment. Update billing to avoid interruption.
        </p>
      )}
      {sub.status === "expired" && (
        <p className="mt-3 text-xs text-destructive">
          Your plan has expired. Renew now to continue receiving leads.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 relative">
        <Button asChild size="sm" variant="hero">
          <Link to="/trainer/billing">
            {isExpired ? <RefreshCw className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
            {isExpired ? "Renew Now" : isTrial ? "Choose Plan" : "Upgrade Plan"}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/trainer/billing"><CreditCard className="h-3 w-3 mr-1" /> Manage Billing</Link>
        </Button>
        {sub.status === "active" && !sub.cancel_at_period_end && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={cancel.isPending}>
            <XCircle className="h-3 w-3 mr-1" /> Cancel
          </Button>
        )}
        {sub.cancel_at_period_end && !isExpired && (
          <Button size="sm" variant="ghost" onClick={onReactivate} disabled={reactivate.isPending}>
            <RefreshCw className="h-3 w-3 mr-1" /> Resume
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;
