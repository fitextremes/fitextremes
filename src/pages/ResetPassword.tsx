import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { cameFromRecoveryLink } from "@/lib/recoveryDetection";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const passwordChecks = (value: string) => ({
  minLength: value.length >= 8,
  uppercase: /[A-Z]/.test(value),
  lowercase: /[a-z]/.test(value),
  number: /[0-9]/.test(value),
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
  noSpaces: !/\s/.test(value),
});

const PasswordCheck = ({ met, label }: { met: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 text-xs">
    {met ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />}
    <span className={met ? "text-primary" : "text-muted-foreground/60"}>{label}</span>
  </div>
);

type RecoveryState = "checking" | "valid" | "invalid";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let resolved = false;

    const markValid = () => {
      if (resolved) return;
      resolved = true;
      setRecoveryState("valid");
    };

    // 1. If we captured a recovery indicator from the URL at app boot, trust it.
    if (cameFromRecoveryLink) {
      markValid();
    }

    // 2. Listen for PASSWORD_RECOVERY event (fires when Supabase processes the link).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        markValid();
      } else if (event === "SIGNED_IN" && cameFromRecoveryLink) {
        // Some flows fire SIGNED_IN instead of PASSWORD_RECOVERY after token exchange.
        markValid();
      }
    });

    // 3. As a fallback, check existing session. If there's an active session AND
    //    the user came directly to /reset-password from a recovery link, treat as valid.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && cameFromRecoveryLink) {
        markValid();
      } else if (!resolved) {
        // Give the auth state a brief window to settle (e.g. PKCE code exchange)
        // before declaring the link invalid.
        setTimeout(() => {
          if (!resolved) {
            setRecoveryState("invalid");
          }
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checks = passwordChecks(password);
  const allChecksPassed = Object.values(checks).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const isFormValid = allChecksPassed && passwordsMatch && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Sign out so the user must log in fresh with their new password.
    await supabase.auth.signOut();
    setLoading(false);
    toast.success("Your password has been reset successfully. Please log in with your new password.");
    navigate("/login");
  };

  if (recoveryState === "checking") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar minimal />
        <div className="flex min-h-screen items-center justify-center px-4 pt-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar minimal />
        <div className="flex min-h-screen items-center justify-center px-4 pt-16">
          <div className="w-full max-w-md text-center">
            <img src={logo} alt="FitExtremes" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-2xl uppercase tracking-wider text-foreground mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button variant="hero" onClick={() => navigate("/forgot-password")}>
              Request New Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar minimal />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="FitExtremes" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
              Reset Password
            </h1>
            <p className="mt-2 text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-card space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password && (
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <PasswordCheck met={checks.minLength} label="8+ characters" />
                  <PasswordCheck met={checks.uppercase} label="Uppercase (A-Z)" />
                  <PasswordCheck met={checks.lowercase} label="Lowercase (a-z)" />
                  <PasswordCheck met={checks.number} label="Number (0-9)" />
                  <PasswordCheck met={checks.special} label="Special char" />
                  <PasswordCheck met={checks.noSpaces} label="No spaces" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button variant="hero" className="w-full" size="lg" type="submit" disabled={loading || !isFormValid}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
