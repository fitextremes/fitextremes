import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Allowed roles. If omitted, any authenticated user is allowed. */
  allowedRoles?: Array<"user" | "trainer" | "business">;
  /** Where to send a user whose role isn't allowed. */
  fallbackByRole?: Partial<Record<"user" | "trainer" | "business", string>>;
}

/**
 * Gate that waits for auth + profile to be ready before rendering children.
 * - Shows branded loader while auth or profile is loading
 * - Auto-creates a profile row if missing (defaults: role=user)
 * - Redirects to /login when no session
 * - Redirects to the role's home when role isn't allowed
 */
const ProtectedRoute = ({
  children,
  allowedRoles,
  fallbackByRole = {
    user: "/dashboard",
    trainer: "/trainer-dashboard",
    business: "/business-dashboard",
  },
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [profileReady, setProfileReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      setProfileReady(true);
      return;
    }

    (async () => {
      try {
        console.log("[ProtectedRoute] Fetching profile for", user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (error && (error as any).code !== "PGRST116") {
          console.error("[ProtectedRoute] Profile fetch error:", error);
        }

        let resolvedRole = data?.role ?? null;

        if (!data) {
          console.warn("[ProtectedRoute] No profile found, auto-creating");
          const { data: created, error: insErr } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email ?? null,
              full_name:
                (user.user_metadata as any)?.full_name ||
                user.email ||
                "",
              role: "user",
              profile_visibility: "public",
            })
            .select("id, role")
            .single();
          if (insErr) {
            console.error("[ProtectedRoute] Profile auto-create failed:", insErr);
          } else {
            resolvedRole = created?.role ?? "user";
          }
        }

        if (!active) return;
        setRole(resolvedRole);
        setProfileReady(true);
      } catch (err) {
        console.error("[ProtectedRoute] Unexpected error:", err);
        if (active) setProfileReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  if (authLoading || !profileReady) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role as any)) {
    const target = fallbackByRole[role as "user" | "trainer" | "business"];
    if (target && target !== location.pathname) {
      console.log("[ProtectedRoute] Role mismatch, redirecting to", target);
      return <Navigate to={target} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
