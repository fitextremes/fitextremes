import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTrainerStats = (trainerId?: string) => {
  return useQuery({
    queryKey: ["trainer-stats", trainerId],
    queryFn: async () => {
      if (!trainerId) return { views: 0, leads: 0 };
      const { data, error } = await supabase.rpc("get_trainer_stats", { _trainer_id: trainerId });
      if (error) throw error;
      const j = (data ?? {}) as { views?: number; leads?: number };
      return { views: Number(j.views ?? 0), leads: Number(j.leads ?? 0) };
    },
    enabled: !!trainerId,
  });
};

export const useRecordProfileView = () => {
  return useMutation({
    mutationFn: async (trainerId: string) => {
      await supabase.rpc("record_profile_view", { _trainer_id: trainerId });
    },
  });
};

export const useTrainerLeads = (trainerId?: string) => {
  return useQuery({
    queryKey: ["trainer-leads", trainerId],
    queryFn: async () => {
      if (!trainerId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!trainerId,
  });
};

export const useSubmitLead = (trainerId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; phone?: string; message: string }) => {
      const { error } = await supabase.from("leads").insert({
        trainer_id: trainerId,
        sender_id: user?.id ?? null,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || null,
        message: input.message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-stats", trainerId] });
    },
  });
};

export type TrainerProfile = {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  hourly_min: number | null;
  hourly_max: number | null;
  years_experience: number | null;
  certifications: string | null;
  phone: string | null;
  email: string | null;
  trial_started_at: string | null;
  subscription_status: string;
};

export const useTrainerProfile = (id?: string) => {
  return useQuery({
    queryKey: ["trainer-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("role", "trainer")
        .maybeSingle();
      if (error) throw error;
      return data as TrainerProfile | null;
    },
    enabled: !!id,
  });
};

export const useTrainerList = () => {
  return useQuery({
    queryKey: ["trainer-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, location, bio, hourly_min, hourly_max, years_experience")
        .eq("role", "trainer")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const computeSubscriptionStatus = (
  trialStartedAt: string | null,
  subscriptionStatus: string
): "Active" | "Trial" | "Trial Ending Soon" | "Expired" | "Cancelled" => {
  if (subscriptionStatus === "active") return "Active";
  if (subscriptionStatus === "cancelled") return "Cancelled";
  if (trialStartedAt) {
    const start = new Date(trialStartedAt).getTime();
    const now = Date.now();
    const daysSince = (now - start) / (1000 * 60 * 60 * 24);
    const daysLeft = 30 - daysSince;
    if (daysLeft <= 0) return "Expired";
    if (daysLeft <= 5) return "Trial Ending Soon";
    return "Trial";
  }
  return "Expired";
};
