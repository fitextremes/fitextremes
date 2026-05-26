import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFeedPosts = () => {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["feed-posts", user?.id],
    enabled: !!user && !authLoading,
    retry: 1,
    queryFn: async () => {
      if (!user) return [];

      try {
        // Followed users
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        const followedIds = (follows ?? []).map((f: any) => f.following_id).filter(Boolean);

        // Public profiles (best-effort; never throw)
        let publicIds: string[] = [];
        try {
          const excluded = [user.id, ...followedIds];
          const { data: publicProfiles } = await supabase
            .from("profiles_public" as any)
            .select("id")
            .eq("profile_visibility", "public")
            .limit(50);
          publicIds = ((publicProfiles as any[]) ?? [])
            .map((p) => p?.id)
            .filter((id) => id && !excluded.includes(id));
        } catch (e) {
          console.warn("[Feed] public profiles fetch failed (ignored):", e);
        }

        const feedUserIds = Array.from(new Set([user.id, ...followedIds, ...publicIds]));

        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id (id, username, full_name, avatar_url),
            reactions (id, emoji, user_id),
            comments (id)
          `)
          .in("user_id", feedUserIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("[Feed] posts query error:", error);
          return [];
        }

        // Normalize: ensure no required nested field is null
        return (data ?? []).map((p: any) => ({
          ...p,
          profiles: p.profiles ?? {
            id: p.user_id,
            username: null,
            full_name: "FitExtremes User",
            avatar_url: null,
          },
          reactions: Array.isArray(p.reactions) ? p.reactions : [],
          comments: Array.isArray(p.comments) ? p.comments : [],
        }));
      } catch (e) {
        console.error("[Feed] unexpected error:", e);
        return [];
      }
    },
  });
};

export const useUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url),
          reactions (id, emoji, user_id),
          comments (id)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[UserPosts] error:", error);
        return [];
      }
      return (data ?? []).map((p: any) => ({
        ...p,
        profiles: p.profiles ?? { id: p.user_id, username: null, full_name: "FitExtremes User", avatar_url: null },
        reactions: Array.isArray(p.reactions) ? p.reactions : [],
        comments: Array.isArray(p.comments) ? p.comments : [],
      }));
    },
    enabled: !!userId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, imageFile }: { content: string; imageFile?: File }) => {
      if (!user) throw new Error("Not authenticated");

      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content, image_url })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });
};
