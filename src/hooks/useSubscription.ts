import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export type SubscriptionStatus =
  | "trial" | "trial_ending" | "active" | "payment_due"
  | "grace" | "expired" | "cancelled" | "paused" | "lifetime";

export type SubscriptionPlan = {
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_cycle: string;
};

export type Subscription = {
  id: string;
  status: SubscriptionStatus;
  billing_cycle: string;
  price_cents: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
  trial_used: boolean;
  plan: SubscriptionPlan;
};

export const STATUS_META: Record<SubscriptionStatus, { label: string; tone: string; dot: string }> = {
  trial:         { label: "Trial Active",       tone: "bg-primary/15 text-primary border-primary/40",       dot: "bg-primary" },
  trial_ending:  { label: "Trial Ending Soon",  tone: "bg-accent/15 text-accent border-accent/40",          dot: "bg-accent" },
  active:        { label: "Active",             tone: "bg-primary/15 text-primary border-primary/40",       dot: "bg-primary" },
  payment_due:   { label: "Payment Due",        tone: "bg-accent/15 text-accent border-accent/40",          dot: "bg-accent" },
  grace:         { label: "Grace Period",       tone: "bg-purple-500/15 text-purple-300 border-purple-500/40", dot: "bg-purple-400" },
  expired:       { label: "Expired",            tone: "bg-destructive/15 text-destructive border-destructive/40", dot: "bg-destructive" },
  cancelled:     { label: "Cancelled",          tone: "bg-destructive/15 text-destructive border-destructive/40", dot: "bg-destructive" },
  paused:        { label: "Paused",             tone: "bg-blue-500/15 text-blue-300 border-blue-500/40",    dot: "bg-blue-400" },
  lifetime:      { label: "Lifetime Member",    tone: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40", dot: "bg-yellow-400" },
};

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useMySubscription = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Recompute on every load so badges are always fresh
  useEffect(() => {
    if (!user) return;
    supabase.rpc("recompute_subscription_status", { _trainer_id: user.id }).then(() => {
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
    });
  }, [user, qc]);

  return useQuery({
    queryKey: ["my-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_my_subscription");
      if (error) throw error;
      return data as unknown as Subscription | null;
    },
    enabled: !!user,
  });
};

export const useSubscribeToPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planCode: string) => {
      const { data, error } = await supabase.rpc("subscribe_to_plan", { _plan_code: planCode });
      if (error) throw error;
      return data as { ok: boolean; reason?: string; plan?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
    },
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("cancel_subscription");
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-subscription"] }),
  });
};

export const useReactivateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reactivate_subscription");
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-subscription"] }),
  });
};

export const useSubscriptionEvents = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription-events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("subscription_events")
        .select("*")
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const daysBetween = (iso?: string | null) => {
  if (!iso) return 0;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
};

export const formatPrice = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
