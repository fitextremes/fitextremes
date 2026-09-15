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
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setRole(data?.role ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return {
    role,
    loading,
    isSocial: role === "user",
    isTrainer: role === "trainer",
    isBusiness: role === "business",
  };
};
