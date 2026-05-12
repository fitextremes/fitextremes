import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const PORTAL_ROLE: Record<string, string> = {
  user: "user",
  trainer: "trainer",
  business: "business",
};
const ROLE_LABEL: Record<string, string> = {
  user: "Social User",
  trainer: "Personal Trainer",
  business: "Business User",
};
const PORTAL_PATH: Record<string, string> = {
  user: "/login?role=user",
  trainer: "/login?role=trainer",
  business: "/business-auth?tab=login",
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "user";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { signIn, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const roleLabels: Record<string, string> = {
    user: "Social User",
    trainer: "Personal Trainer",
    business: "Business Owner",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setUnconfirmedEmail(null);
    setLoading(true);
    const { error } = await signIn(identifier.trim(), password);
    if (error) {
      setLoading(false);
      const msg = (error.message || "").toLowerCase();
      const code = (error as any).code || "";
      if (code === "email_not_confirmed" || msg.includes("not confirmed") || msg.includes("confirm your email")) {
        const id = identifier.trim();
        if (id.includes("@")) setUnconfirmedEmail(id.toLowerCase());
        toast.error("Please confirm your email before logging in.");
      } else {
        toast.error(error.message || "Invalid email/username or password");
      }
      return;
    }

    // Verify the authenticated user's role matches the selected portal
    const { data: { user } } = await supabase.auth.getUser();
    const expectedRole = PORTAL_ROLE[roleParam] || "user";
    let actualRole: string | null = null;
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      actualRole = prof?.role ?? null;
    }

    if (actualRole && actualRole !== expectedRole) {
      await supabase.auth.signOut();
      setLoading(false);
      const label = ROLE_LABEL[actualRole] || "another account type";
      const portalLabel = ROLE_LABEL[actualRole] || "correct";
      toast.error(`This email is registered as a ${label}. Please use the ${portalLabel} login.`);
      navigate(PORTAL_PATH[actualRole] || "/login");
      return;
    }

    setLoading(false);
    toast.success("Welcome back!");
    if (roleParam === "trainer") navigate("/trainer-dashboard");
    else if (roleParam === "business") navigate("/business-dashboard");
    else navigate("/profile");
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    const { error } = await resendConfirmation(unconfirmedEmail);
    setResending(false);
    if (error) toast.error(error.message || "Could not resend confirmation email");
    else toast.success("Confirmation email sent. Check your inbox.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar minimal />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="FitExtremes" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
              Welcome Back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Login as <span className="text-primary font-semibold">{roleLabels[roleParam]}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-card space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                placeholder="you@example.com or john_smith"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            {unconfirmedEmail && (
              <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-foreground/90">
                    Your email <span className="font-medium">{unconfirmedEmail}</span> hasn't been confirmed yet.
                    Click the link we sent you, or resend it below.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleResend} disabled={resending}>
                  {resending ? "Sending..." : "Resend Confirmation Email"}
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <Button variant="hero" className="w-full" size="lg" type="submit" disabled={loading || !identifier.trim() || !password}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to={`/signup?role=${roleParam}`} className="text-primary hover:underline">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
