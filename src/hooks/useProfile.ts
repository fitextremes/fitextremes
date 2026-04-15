import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ["profile", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data, error } = await supabase
        .from("profiles")
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
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};

export const useProfileByUsername = (username: string) => {
  return useQuery({
    queryKey: ["profile", "username", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
};
