import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Sparkles, BadgeCheck, AlertTriangle, CreditCard, X, RotateCcw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useMySubscription, daysBetween, useCancelSubscription,
} from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import UpdatePaymentDialog from "@/components/UpdatePaymentDialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { toast } from "sonner";

const PLAN_CONFIG = {
  business: { name: "Business Plan", price: 30, priceId: "business_monthly" },
  trainer: { name: "Personal Trainer Plan", price: 15, priceId: "trainer_monthly" },
} as const;

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const SubscriptionCard = () => {
  const { data: sub, isLoading } = useMySubscription();
  const { isBusiness } = useUserRole();
  const cfg = isBusiness ? PLAN_CONFIG.business : PLAN_CONFIG.trainer;
  const cancelMut = useCancelSubscription();
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse h-40" />;
  }
  if (!sub) return null;

  const isTrial = sub.status === "trial" || sub.status === "trial_ending";
  const isActive = sub.status === "active";
  const isPaymentDue = sub.status === "payment_due" || sub.status === "grace";
  const isExpired = sub.status === "expired";
  const isCancelScheduled = sub.cancel_at_period_end && !isExpired;
  const isCancelled = sub.status === "cancelled";
  const daysLeft = Math.max(0, daysBetween(sub.end_date));
  const endDate = formatDate(sub.end_date);
  const nextBilling = formatDate(sub.next_billing_date || sub.end_date);

  const handleCancel = async () => {
    try {
      await cancelMut.mutateAsync();
      toast.success("Subscription cancelled. Access continues until your billing period ends.");
    } catch {
      toast.error("Could not cancel subscription. Please try again.");
    } finally {
      setCancelOpen(false);
    }
  };

  const handleReactivate = () => {
    setCheckoutOpen(true);
  };

  return (
    <>
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
            <h3 className="font-display text-2xl text-foreground mt-1">{cfg.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">First Month Free · Then ${cfg.price} CAD/month</p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {isTrial && (
              <Badge className="border bg-primary/15 text-primary border-primary/40 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Free Trial Active
              </Badge>
            )}
            {isActive && !isCancelScheduled && (
              <Badge className="border bg-primary/15 text-primary border-primary/40 flex items-center gap-1.5">
                <BadgeCheck className="h-3 w-3" /> Active Subscription
              </Badge>
            )}
            {isPaymentDue && (
              <Badge className="border bg-accent/15 text-accent border-accent/40 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Payment Failed
              </Badge>
            )}
            {isCancelScheduled && (
              <Badge className="border bg-accent/15 text-accent border-accent/40">Cancellation Scheduled</Badge>
            )}
            {(isExpired || isCancelled) && (
              <Badge className="border bg-destructive/15 text-destructive border-destructive/40">
                {isCancelled ? "Cancelled" : "Expired"}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-5 relative">
          {isTrial ? (
            <div className="rounded-xl bg-secondary/40 border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trial Status</p>
              <p className="font-display text-xl text-foreground mt-1">
                Free Trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Trial ends on {endDate}. Billing starts automatically at ${cfg.price} CAD/month after trial.
              </p>
            </div>
          ) : isCancelScheduled ? (
            <div className="rounded-xl bg-secondary/40 border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Access Until</p>
              <p className="font-display text-xl text-foreground mt-1">Subscription Ends On {endDate}</p>
              <p className="text-xs text-muted-foreground mt-1">You won't be charged again. Reactivate anytime before this date.</p>
            </div>
          ) : isPaymentDue ? (
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-4">
              <p className="text-sm text-foreground">
                We couldn't process your last payment. Please update your card to continue uninterrupted access.
              </p>
            </div>
          ) : isExpired || isCancelled ? (
            <div className="rounded-xl bg-secondary/40 border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Your plan has ended. Reactivate to restore your trainer benefits.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-secondary/40 border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Next Billing Date
              </p>
              <p className="font-display text-xl text-foreground mt-1">{nextBilling}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2 relative">
          {!isExpired && !isCancelled && (
            <Button variant="outline" className="flex-1" onClick={() => setPayOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" /> Update Payment Information
            </Button>
          )}

          {isTrial || isCancelScheduled || isExpired || isCancelled || isPaymentDue ? (
            <Button className="flex-1" onClick={handleReactivate}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {isTrial ? "Subscribe Now" : "Reactivate Subscription"}
            </Button>
          ) : (
            <Button variant="destructive" className="flex-1" onClick={() => setCancelOpen(true)}>
              <X className="h-4 w-4 mr-2" /> Cancel Subscription
            </Button>
          )}
        </div>
      </motion.div>

      <UpdatePaymentDialog open={payOpen} onOpenChange={setPayOpen} />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of your current billing cycle. You will not be charged again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleCancel(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling</> : "Confirm Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">
              Subscribe to {cfg.name} — ${cfg.price} CAD/month
            </DialogTitle>
          </DialogHeader>
          {checkoutOpen && (
            <StripeEmbeddedCheckout
              priceId={cfg.priceId}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionCard;
