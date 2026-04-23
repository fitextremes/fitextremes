import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";
import { useEffect } from "react";

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
  const queryClient = useQueryClient();

  // Live-update the button state when the target accepts/declines our request,
  // or when our follow row is created/removed elsewhere.
  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`follow-state-${user.id}-${targetUserId}-${suffix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follow_requests", filter: `requester_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["follow-state", user.id, targetUserId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["follow-state", user.id, targetUserId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, targetUserId, queryClient]);

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
        const { data: inserted, error } = await supabase
          .from("follow_requests" as any)
          .insert({ requester_id: user.id, target_id: targetUserId, status: "pending" })
          .select("id")
          .single();
        if (error) throw error;
        const reqId = (inserted as any)?.id ?? null;
        // Notify target (new request received) and sender (request sent confirmation)
        await Promise.all([
          createNotification({
            recipientId: targetUserId,
            actorId: user.id,
            type: "follow_request_received",
            followRequestId: reqId,
          }),
          createNotification({
            recipientId: user.id,
            actorId: user.id,
            type: "follow_request_sent",
            followRequestId: reqId,
          }),
        ]);
        return { state: "requested" as FollowState, action: "request_sent" };
      }

      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error) throw error;
      // Notify target (new follower) and sender (follow success)
      await Promise.all([
        createNotification({ recipientId: targetUserId, actorId: user.id, type: "new_follower" }),
        createNotification({ recipientId: user.id, actorId: user.id, type: "follow_success" }),
      ]);
      return { state: "following" as FollowState, action: "followed" };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["follow-state", user?.id, variables.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["explore-users"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests-incoming"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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

      // All follow-request resolution happens server-side via a SECURITY DEFINER
      // function so the target (private user) can atomically:
      //  - validate ownership
      //  - create the follows row on behalf of the requester
      //  - delete the pending request
      //  - clean up both notification entries
      //  - notify the sender of the outcome
      // This is required because RLS prevents the target from inserting a
      // follows row where follower_id = requesterId, or deleting the request.
      const { data, error } = await (supabase as any).rpc("resolve_follow_request", {
        _request_id: requestId,
        _accept: accept,
      });
      if (error) throw error;
      const result = data as { ok: boolean; reason?: string; status?: string };
      if (!result?.ok) {
        if (result?.reason === "already_resolved" || result?.reason === "not_found") {
          throw new Error("This request was already resolved");
        }
        throw new Error("Could not complete action. Please try again.");
      }
      return { accepted: accept, requesterId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests-incoming"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["follow-state"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
