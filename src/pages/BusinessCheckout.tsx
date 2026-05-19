import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { StripeTestCardsHelper } from "@/components/StripeTestCardsHelper";
import { useQuery } from "@tanstack/react-query";

const BusinessCheckout = () => {
  const { user, loading: authLoading } = useAuth();
  const { isBusiness, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/business-auth?tab=login", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !isBusiness) navigate("/dashboard", { replace: true });
  }, [roleLoading, isBusiness, user, navigate]);

  // If already has a Stripe sub, bounce to dashboard
  const { data: sub } = useQuery({
    queryKey: ["my-stripe-sub", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("trainer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (sub?.stripe_subscription_id) navigate("/business-dashboard", { replace: true });
  }, [sub, navigate]);

  if (authLoading || roleLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar minimal />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground">
              Activate Your Business Account
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add a payment method to start your 1-month free trial. You won't be charged today — billing begins automatically after 30 days unless you cancel.
            </p>
          </div>

          <StripeTestCardsHelper />

          <div className="rounded-2xl border border-border bg-card p-4 md:p-6 shadow-card">
            <StripeEmbeddedCheckout
              priceId="business_monthly"
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-3 w-3 mr-1" /> Back to home
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/business-auth?tab=login"); }}>
              <LogOut className="h-3 w-3 mr-1" /> Log out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BusinessCheckout;
