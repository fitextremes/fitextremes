import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const isOwn = !!user && !!targetId && user.id === targetId;

  return useQuery({
    queryKey: ["profile", targetId, isOwn],
    queryFn: async (): Promise<any> => {
      if (!targetId) return null;
      if (isOwn) {
        const { data, error } = await supabase.rpc("get_my_full_profile" as any);
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase as any)
        .from("profiles_public")
        .select("*")
        .eq("id", targetId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      bio?: string;
      location?: string;
      avatar_url?: string;
      profile_visibility?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      // NOTE: no `.select()` here — SELECT is not granted on `profiles` to the
      // `authenticated` role (owner reads go through get_my_full_profile), so a
      // returning-select would fail the whole update with a permission error.
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) {
        console.error("[useUpdateProfile] update failed:", error);
        throw error;
      }
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

  });
};

export const useProfileByUsername = (username: string) => {
  return useQuery({
    queryKey: ["profile", "username", username],
    queryFn: async (): Promise<any> => {
      const { data, error } = await (supabase as any)
        .from("profiles_public")
        .select("*")
        .ilike("username", username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
};
