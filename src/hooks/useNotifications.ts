import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export type NotificationType =
  | "follow_request_sent"
  | "follow_request_received"
  | "follow_request_accepted"
  | "follow_request_accepted_self"
  | "follow_request_declined"
  | "follow_request_declined_self"
  | "follow_request_cancelled"
  | "follow_success"
  | "new_follower"
  | "post_reaction"
  | "post_comment";

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  follow_request_id: string | null;
  read: boolean;
  created_at: string;
  /** True only when this notification's follow_request still exists and is pending. */
  request_pending?: boolean;
  actor?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Create a notification. Caller must be the actor (per RLS).
 * Use whenever a follow-related action occurs.
 */
export const createNotification = async (params: {
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  followRequestId?: string | null;
}) => {
  if (params.recipientId === params.actorId) return; // never notify self
  await supabase.from("notifications" as any).insert({
    recipient_id: params.recipientId,
    actor_id: params.actorId,
    type: params.type,
    follow_request_id: params.followRequestId ?? null,
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async (): Promise<NotificationItem[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const actorIds = Array.from(
        new Set(rows.map((r) => r.actor_id).filter(Boolean))
      ) as string[];
      const requestIds = Array.from(
        new Set(
          rows
            .filter((r) => r.type === "follow_request_received" && r.follow_request_id)
            .map((r) => r.follow_request_id)
        )
      ) as string[];
      let profiles: Record<string, any> = {};
      if (actorIds.length) {
        const { data: pr } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", actorIds);
        (pr ?? []).forEach((p: any) => (profiles[p.id] = p));
      }
      let pendingRequests: Record<string, true> = {};
      if (requestIds.length) {
        const { data: reqs } = await supabase
          .from("follow_requests")
          .select("id, status")
          .in("id", requestIds)
          .eq("status", "pending");
        (reqs ?? []).forEach((r: any) => (pendingRequests[r.id] = true));
      }
      return rows.map((r) => ({
        ...r,
        actor: r.actor_id ? profiles[r.actor_id] ?? null : null,
        request_pending:
          r.type === "follow_request_received"
            ? !!(r.follow_request_id && pendingRequests[r.follow_request_id])
            : undefined,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
};

export const useUnreadNotificationCount = () => {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
};

export const useMarkNotificationsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      if (!user) return;
      const q = supabase
        .from("notifications" as any)
        .update({ read: true })
        .eq("recipient_id", user.id);
      if (ids && ids.length) {
        await q.in("id", ids);
      } else {
        await q.eq("read", false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
};
