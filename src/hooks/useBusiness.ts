import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BusinessEventType =
  | "call_click" | "whatsapp_click" | "website_click" | "delivery_request" | "instagram_click";

export type BusinessProfileRow = {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  business_type: string | null;
  website_url: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  home_delivery: string | null;
  business_hours: any;
  is_suspended: boolean;
};

export type BusinessStats = {
  views: number;
  leads: number;
  leads_new: number;
  call_clicks: number;
  whatsapp_clicks: number;
  website_clicks: number;
  delivery_requests: number;
};

export const useBusinessProfile = (id?: string) =>
  useQuery({
    queryKey: ["business-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from("profiles_public")
        .select("*")
        .eq("id", id)
        .eq("role", "business")
        .maybeSingle();
      if (error) throw error;
      return data as BusinessProfileRow | null;
    },
    enabled: !!id,
  });

export const useBusinessStats = (businessId?: string) =>
  useQuery({
    queryKey: ["business-stats", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase.rpc("get_business_stats", { _business_id: businessId });
      if (error) throw error;
      const j = (data ?? {}) as Partial<BusinessStats>;
      return {
        views: Number(j.views ?? 0),
        leads: Number(j.leads ?? 0),
        leads_new: Number(j.leads_new ?? 0),
        call_clicks: Number(j.call_clicks ?? 0),
        whatsapp_clicks: Number(j.whatsapp_clicks ?? 0),
        website_clicks: Number(j.website_clicks ?? 0),
        delivery_requests: Number(j.delivery_requests ?? 0),
      } as BusinessStats;
    },
    enabled: !!businessId,
  });

export const useBusinessLeads = (businessId?: string) =>
  useQuery({
    queryKey: ["business-leads", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("trainer_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

export const useUpdateLeadStatus = (businessId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: "new" | "contacted" | "closed" }) => {
      const { data, error } = await supabase.rpc("update_lead_status", { _lead_id: leadId, _status: status });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-leads", businessId] });
      qc.invalidateQueries({ queryKey: ["business-stats", businessId] });
    },
  });
};

export const useRecordBusinessEvent = () =>
  useMutation({
    mutationFn: async ({ businessId, eventType }: { businessId: string; eventType: BusinessEventType }) => {
      await supabase.rpc("record_business_event", { _business_id: businessId, _event_type: eventType });
    },
  });

export const useSubmitBusinessLead = (businessId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; phone?: string; message: string }) => {
      const { error } = await supabase.from("leads").insert({
        trainer_id: businessId,
        sender_id: user?.id ?? null,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || null,
        message: input.message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-stats", businessId] });
    },
  });
};

export const useBusinessGallery = (businessId?: string) =>
  useQuery({
    queryKey: ["business-gallery", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("business_gallery")
        .select("*")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

export const useUploadBusinessGalleryImage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("business-gallery").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("business-gallery").getPublicUrl(path);
      const { error } = await supabase.from("business_gallery").insert({
        business_id: user.id,
        image_url: data.publicUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-gallery"] }),
  });
};

export const useDeleteBusinessGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-gallery"] }),
  });
};

export const useBusinessList = () =>
  useQuery({
    queryKey: ["business-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public" as any)
        .select("id, full_name, username, avatar_url, location, business_type, bio")
        .eq("role", "business")
        .eq("is_suspended", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
