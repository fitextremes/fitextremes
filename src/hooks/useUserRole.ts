import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Reusable role hook for role-based navigation/permissions.
 * Roles: 'user' (Socials), 'trainer', 'business'.
 */
export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
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
