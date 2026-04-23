import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Status of follow relationship between current user and a target profile.
 * - "self"        → the target is the current user
 * - "following"   → already following (row in follows)
 * - "requested"   → pending follow request (row in follow_requests, status pending)
 * - "none"        → no relationship
 */
export type FollowState = "self" | "following" | "requested" | "none";

export const useFollowState = (targetUserId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["follow-state", user?.id, targetUserId],
    queryFn: async (): Promise<FollowState> => {
      if (!user || !targetUserId) return "none";
      if (user.id === targetUserId) return "self";

      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      if (follow) return "following";

      const { data: req } = await supabase
        .from("follow_requests" as any)
        .select("id, status")
        .eq("requester_id", user.id)
        .eq("target_id", targetUserId)
        .eq("status", "pending")
        .maybeSingle();
      if (req) return "requested";

      return "none";
    },
    enabled: !!user && !!targetUserId,
  });
};

/**
 * Privacy-aware follow toggle.
 * - Public target → immediate follow / unfollow.
 * - Private target → create follow_request (pending) / cancel pending request.
 * - Already following a private target → unfollow (revokes access).
 */
export const useFollowAction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isPrivate,
      currentState,
    }: {
      targetUserId: string;
      isPrivate: boolean;
      currentState: FollowState;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (user.id === targetUserId) throw new Error("Cannot follow yourself");

      if (currentState === "following") {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        return { state: "none" as FollowState, action: "unfollowed" };
      }

      if (currentState === "requested") {
        await supabase
          .from("follow_requests" as any)
          .delete()
          .eq("requester_id", user.id)
          .eq("target_id", targetUserId);
        return { state: "none" as FollowState, action: "request_cancelled" };
      }

      // currentState === "none"
      if (isPrivate) {
        const { error } = await supabase
          .from("follow_requests" as any)
          .insert({ requester_id: user.id, target_id: targetUserId, status: "pending" });
        if (error) throw error;
        return { state: "requested" as FollowState, action: "request_sent" };
      }

      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error) throw error;
      return { state: "following" as FollowState, action: "followed" };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["follow-state", user?.id, variables.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["explore-users"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests-incoming"] });
    },
  });
};

/** Incoming pending follow requests for the current user (target). */
export const useIncomingFollowRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["follow-requests-incoming", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("follow_requests" as any)
        .select(`
          id,
          requester_id,
          status,
          created_at,
          profiles:requester_id (id, username, full_name, avatar_url, location)
        `)
        .eq("target_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useRespondFollowRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId,
      requesterId,
      accept,
    }: {
      requestId: string;
      requesterId: string;
      accept: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (accept) {
        // Create follow relationship requester -> me, then mark request accepted.
        const { error: followErr } = await supabase
          .from("follows")
          .insert({ follower_id: requesterId, following_id: user.id });
        // Ignore unique-violation if relationship already exists.
        if (followErr && !`${followErr.message}`.toLowerCase().includes("duplicate")) {
          throw followErr;
        }
        const { error } = await supabase
          .from("follow_requests" as any)
          .update({ status: "accepted" })
          .eq("id", requestId);
        if (error) throw error;
        return { accepted: true };
      }

      const { error } = await supabase
        .from("follow_requests" as any)
        .update({ status: "declined" })
        .eq("id", requestId);
      if (error) throw error;
      return { accepted: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests-incoming"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["follow-state"] });
    },
  });
};
