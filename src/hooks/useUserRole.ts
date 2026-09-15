import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Reusable role hook for role-based navigation/permissions.
 * Roles: 'user' (Socials), 'trainer', 'business'.
 */
export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Wait for the session to be restored before deciding there is no role,
    // otherwise role-gated pages redirect during the auth hydration window.
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      // Primary: owner RPC (unaffected by profiles PII policies)
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc("get_my_full_profile");
      let resolved: string | null = null;
      if (!rpcError && rpcData) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        resolved = row?.role ?? null;
      }
      if (!resolved) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        resolved = (data as any)?.role ?? null;
      }
      if (!active) return;
      // Default to the social experience so navigation never disappears
      setRole(resolved ?? "user");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return {
    role,
    loading,
    isSocial: role === "user",
    isTrainer: role === "trainer",
    isBusiness: role === "business",
  };
};
