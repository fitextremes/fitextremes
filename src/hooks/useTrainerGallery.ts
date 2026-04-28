import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type GalleryItem = {
  id: string;
  trainer_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

export const useTrainerGallery = (trainerId?: string) => {
  return useQuery({
    queryKey: ["trainer-gallery", trainerId],
    queryFn: async () => {
      if (!trainerId) return [] as GalleryItem[];
      const { data, error } = await supabase
        .from("trainer_gallery" as any)
        .select("*")
        .eq("trainer_id", trainerId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GalleryItem[];
    },
    enabled: !!trainerId,
  });
};

export const useUploadGalleryImages = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: existing, error: exErr } = await supabase
        .from("trainer_gallery" as any)
        .select("id, sort_order")
        .eq("trainer_id", user.id);
      if (exErr) throw exErr;

      const currentCount = existing?.length ?? 0;
      if (currentCount + files.length > MAX_IMAGES) {
        throw new Error(`You can upload a maximum of ${MAX_IMAGES} images.`);
      }

      for (const f of files) {
        if (!ALLOWED.includes(f.type)) {
          throw new Error("Only JPG, JPEG, PNG, WEBP files are allowed.");
        }
        if (f.size > MAX_BYTES) {
          throw new Error("Each image must be 5 MB or less.");
        }
      }

      let nextOrder = (existing as any[])?.reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1) + 1;

      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("trainer-gallery")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("trainer-gallery").getPublicUrl(path);
        const { error: insErr } = await supabase.from("trainer_gallery" as any).insert({
          trainer_id: user.id,
          image_url: pub.publicUrl,
          sort_order: nextOrder++,
          is_featured: currentCount === 0 && nextOrder === 1,
        });
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-gallery", user?.id] });
    },
  });
};

export const useDeleteGalleryImage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: GalleryItem) => {
      // Best-effort storage cleanup
      try {
        const url = new URL(item.image_url);
        const idx = url.pathname.indexOf("/trainer-gallery/");
        if (idx >= 0) {
          const path = url.pathname.substring(idx + "/trainer-gallery/".length);
          await supabase.storage.from("trainer-gallery").remove([decodeURIComponent(path)]);
        }
      } catch {}
      const { error } = await supabase
        .from("trainer_gallery" as any)
        .delete()
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-gallery", user?.id] });
    },
  });
};

export const useReorderGallery = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from("trainer_gallery" as any)
          .update({ sort_order: i })
          .eq("id", orderedIds[i]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-gallery", user?.id] });
    },
  });
};

export const useSetFeaturedImage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      await supabase
        .from("trainer_gallery" as any)
        .update({ is_featured: false })
        .eq("trainer_id", user.id);
      const { error } = await supabase
        .from("trainer_gallery" as any)
        .update({ is_featured: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-gallery", user?.id] });
    },
  });
};

export const useUpdateCaption = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string }) => {
      const { error } = await supabase
        .from("trainer_gallery" as any)
        .update({ caption })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-gallery", user?.id] });
    },
  });
};

export const GALLERY_LIMITS = { MAX_IMAGES, MAX_BYTES, ALLOWED };
