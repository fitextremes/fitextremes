import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: string, username?: string, extra?: Record<string, any>) => Promise<{ error: any; session: Session | null; user: User | null }>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe first so we don't miss any auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] state change:", event, !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Explicitly restore any persisted session on mount (critical for mobile/Capacitor cold launch)
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] initial getSession:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error("[Auth] getSession failed:", err);
      setLoading(false);
    });

    // Safety net: never stay in loading state forever
    const timeout = setTimeout(() => setLoading(false), 5000);

    // Refresh session when app returns to foreground (mobile)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);


  const signUp = async (email: string, password: string, fullName: string, role: string, username?: string, extra?: Record<string, any>) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username?.trim().toLowerCase() || undefined;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), role, username: normalizedUsername, ...(extra || {}) },
      },
    });
    // Force email verification: never keep an auto-created session from signUp().
    // User must confirm email and explicitly sign in.
    if (data.session) {
      await supabase.auth.signOut();
    }
    return { error, session: null, user: data.user };
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    const identifier = emailOrUsername.trim();

    if (!identifier.includes("@")) {
      // Username login: resolve email and sign in server-side to avoid
      // leaking emails to anonymous callers.
      const { data, error: fnError } = await supabase.functions.invoke("username-signin", {
        body: { username: identifier, password },
      });
      if (fnError || !data?.session) {
        return { error: { message: "Invalid username or password" } };
      }
      const { error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      return { error };
    }

    const email = identifier.toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
