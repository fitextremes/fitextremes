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
    // Rely solely on onAuthStateChange. It fires an INITIAL_SESSION event
    // after Supabase has attempted to refresh any stored token, so we avoid
    // the race where getSession() returns a stale session that is then
    // invalidated by a failed refresh — which caused the UI to flicker
    // between authenticated and signed-out states.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    let email = identifier.toLowerCase();

    if (!identifier.includes("@")) {
      const normalizedUsername = identifier.toLowerCase();
      const { data, error: lookupError } = await supabase
        .from("profiles")
        .select("email")
        .ilike("username", normalizedUsername)
        .maybeSingle();

      if (lookupError || !data?.email) {
        return { error: { message: "No account found with that username" } };
      }
      email = data.email.toLowerCase();
    }

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
