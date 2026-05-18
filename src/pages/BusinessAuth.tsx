import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, XCircle, Building2, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const validateFullName = (v: string) => {
  const t = v.trim();
  if (!t) return "This field is required";
  if (t.length < 2) return "Enter valid name";
  if (t.length > 50) return "Max 50 characters";
  if (!/^[a-zA-Z][a-zA-Z\s'-]*$/.test(t)) return "Enter valid name";
  return "";
};
const validateUsername = (v: string) => {
  if (!v) return "This field is required";
  if (v.length < 4) return "Username must be at least 4 characters";
  if (/\s/.test(v)) return "Invalid username";
  if (!/^[a-zA-Z0-9_.]+$/.test(v)) return "Invalid username";
  return "";
};
const validateEmail = (v: string) => {
  if (!v) return "This field is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email";
  return "";
};
const pwChecks = (v: string) => ({
  len: v.length >= 8,
  up: /[A-Z]/.test(v),
  lo: /[a-z]/.test(v),
  num: /[0-9]/.test(v),
  sp: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
});
const validatePassword = (v: string) => {
  if (!v) return "This field is required";
  const c = pwChecks(v);
  if (!c.len || !c.up || !c.lo || !c.num || !c.sp) return "Password must meet required format";
  return "";
};

const Check = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 text-[11px]">
    {ok ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-muted-foreground/50" />}
    <span className={ok ? "text-primary" : "text-muted-foreground/60"}>{label}</span>
  </div>
);

const BusinessAuth = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "login" ? "login" : "signup";
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const [tab, setTab] = useState<"signup" | "login">(initialTab);
  const [businessType, setBusinessType] = useState<string>("");

  // Signup state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUnique, setCheckingUnique] = useState(false);
  const [uniqueErrors, setUniqueErrors] = useState<{ username?: string; email?: string }>({});

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const errors = useMemo(() => ({
    fullName: validateFullName(fullName),
    username: validateUsername(username),
    email: validateEmail(email),
    password: validatePassword(password),
    businessType: businessType ? "" : "Please choose a business type",
  }), [fullName, username, email, password, businessType]);

  const c = pwChecks(password);
  const formValid = !errors.fullName && !errors.username && !errors.email && !errors.password && !errors.businessType;

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

  const handleStartClick = async () => {
    setTouched({ fullName: true, username: true, email: true, password: true, businessType: true });
    if (!formValid) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setCheckingUnique(true);
    setUniqueErrors({});
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const [{ data: uRow }, { data: eRow }] = await Promise.all([
        supabase.from("profiles").select("id").ilike("username", normalizedUsername).maybeSingle(),
        supabase.from("profiles").select("id, role").eq("email", normalizedEmail).maybeSingle(),
      ]);
      const next: { username?: string; email?: string } = {};
      if (uRow) next.username = "Username is already taken.";
      if (eRow) {
        const label = ROLE_LABEL[(eRow as any).role] || "another account type";
        next.email = `This email is already registered as a ${label}.`;
      }
      if (next.username || next.email) {
        setUniqueErrors(next);
        toast.error(next.email || next.username!);
        return;
      }
      setShowPayment(true);
    } catch {
      toast.error("Could not validate your details. Please try again.");
    } finally {
      setCheckingUnique(false);
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    const { error, session } = await signUp(email, password, fullName, "business", username, { business_type: businessType });
    setLoading(false);
    setShowPayment(false);
    if (error) {
      toast.error(error.message || "Could not create account");
      return;
    }
    if (session) {
      toast.success("Your free trial has started successfully.");
      navigate("/business-dashboard");
    } else {
      toast.success("Account created. Check your email to confirm before logging in.");
      navigate("/login?role=business");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !loginPw) return;
    setLoginLoading(true);
    const { error } = await signIn(identifier.trim(), loginPw);
    if (error) {
      setLoginLoading(false);
      toast.error("Invalid email/username or password");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    let actualRole: string | null = null;
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      actualRole = prof?.role ?? null;
    }
    if (actualRole && actualRole !== "business") {
      await supabase.auth.signOut();
      setLoginLoading(false);
      const label = ROLE_LABEL[actualRole] || "another account type";
      toast.error(`This email is registered as a ${label}. Please use the ${label} login.`);
      navigate(PORTAL_PATH[actualRole] || "/login");
      return;
    }
    setLoginLoading(false);
    toast.success("Welcome back!");
    navigate("/business-dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar minimal />
      <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="FitExtremes" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-3xl uppercase tracking-wider text-foreground flex items-center justify-center gap-2">
              <Building2 className="h-7 w-7 text-primary" /> Business Portal
            </h1>
            <p className="mt-2 text-muted-foreground">Grow your business with FitExtremes</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="login">Log In</TabsTrigger>
              </TabsList>

              <div className="space-y-2 mb-5">
                <Label>Business Type <span className="text-destructive">*</span></Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplement_store">Supplement Store</SelectItem>
                    <SelectItem value="gym">Fitness Centre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, fullName: true }))} placeholder="Owner's full name" />
                  {touched.fullName && errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Username <span className="text-destructive">*</span></Label>
                  <Input value={username} onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUniqueErrors((p) => ({ ...p, username: undefined })); }} onBlur={() => setTouched((t) => ({ ...t, username: true }))} placeholder="iron_paradise" />
                  {touched.username && errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                  {uniqueErrors.username && <p className="text-xs text-destructive">{uniqueErrors.username}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setUniqueErrors((p) => ({ ...p, email: undefined })); }} onBlur={() => setTouched((t) => ({ ...t, email: true }))} placeholder="you@business.com" />
                  {touched.email && errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  {uniqueErrors.email && <p className="text-xs text-destructive">{uniqueErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      className="pr-10"
                      placeholder="Min 8 characters"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <Check ok={c.len} label="8+ characters" />
                      <Check ok={c.up} label="Uppercase" />
                      <Check ok={c.lo} label="Lowercase" />
                      <Check ok={c.num} label="Number" />
                      <Check ok={c.sp} label="Special char" />
                    </div>
                  )}
                  {touched.password && errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button variant="hero" className="w-full" size="lg" disabled={checkingUnique} onClick={handleStartClick}>
                  {checkingUnique ? "Validating..." : "Start Your Free Trial"}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  1 month free. Then $30/month. Cancel anytime.
                </p>
              </TabsContent>

              <TabsContent value="login" className="space-y-4 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Email or Username</Label>
                    <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="you@business.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} required />
                  </div>
                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                  </div>
                  <Button variant="hero" className="w-full" size="lg" type="submit" disabled={loginLoading}>
                    {loginLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BusinessAuth;
