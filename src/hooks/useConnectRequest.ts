import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useConnectRequest = (targetType: string, targetId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const existing = useQuery({
    queryKey: ["connect-request", user?.id, targetType, targetId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("connection_requests")
        .select("id, status")
        .eq("sender_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("status", "pending")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const send = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("connection_requests").insert({
        sender_id: user.id,
        target_type: targetType,
        target_id: targetId,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connect-request", user?.id, targetType, targetId],
      });
    },
  });

  return { existingRequest: existing.data, send, isLoading: existing.isLoading };
};
