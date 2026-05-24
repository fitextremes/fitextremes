import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";

export const useFollowStatus = (targetUserId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["follow-status", user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId || user.id === targetUserId) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (existing) {
        await supabase.from("follows").delete().eq("id", existing.id);
        return { followed: false };
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });
        return { followed: true };
      }
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["explore-users"] });
    },
  });
};

export const useFollowerCount = (userId?: string) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      return count || 0;
    },
    enabled: !!userId,
  });
};

export const useFollowingCount = (userId?: string) => {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
      return count || 0;
    },
    enabled: !!userId,
  });
};

export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("reactions").delete().eq("id", existing.id);
        return { added: false };
      } else {
        await supabase.from("reactions").insert({
          post_id: postId,
          user_id: user.id,
          emoji,
        });
        // Notify post owner (if not self)
        const { data: post } = await supabase
          .from("posts")
          .select("user_id")
          .eq("id", postId)
          .maybeSingle();
        if (post && post.user_id && post.user_id !== user.id) {
          await createNotification({
            recipientId: post.user_id,
            actorId: user.id,
            type: "post_reaction",
          });
        }
        return { added: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select(`*, profiles:user_id (id, username, full_name, avatar_url)`)
        .single();
      if (error) throw error;
      // Notify post owner (if not self)
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .maybeSingle();
      if (post && post.user_id && post.user_id !== user.id) {
        await createNotification({
          recipientId: post.user_id,
          actorId: user.id,
          type: "post_comment",
        });
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
    },
  });
};

export const usePostComments = (postId?: string) => {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("comments")
        .select(`*, profiles:user_id (id, username, full_name, avatar_url)`)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
};

export const useExploreUsers = (searchQuery?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["explore-users", searchQuery],
    queryFn: async () => {
      let query = (supabase as any)
        .from("profiles_public")
        .select("*")
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(
          `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        );
      }

      if (user) {
        query = query.neq("id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
