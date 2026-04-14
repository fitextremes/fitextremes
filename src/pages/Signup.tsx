import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const roles = [
  { value: "user", label: "Social User", description: "Explore gyms, trainers & connect", price: "Free" },
  { value: "trainer", label: "Personal Trainer", description: "Showcase services & receive leads", price: "$15/mo" },
  { value: "business", label: "Business Owner", description: "List your gym, studio or store", price: "$30/mo" },
];

// --- Validation helpers ---
const validateFullName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "This field is required";
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) return "Only alphabets are allowed";
  return "";
};

const validateUsername = (value: string) => {
  if (!value) return "This field is required";
  if (value.length < 3) return "Username must be at least 3 characters";
  if (value.length > 30) return "Username must be 30 characters or less";
  if (/\s/.test(value)) return "Username cannot contain spaces";
  if (!/^[a-zA-Z0-9_.]+$/.test(value)) return "Only letters, numbers, underscore and dot allowed";
  return "";
};

const validateEmail = (value: string) => {
  if (!value) return "This field is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
  return "";
};

const passwordChecks = (value: string) => ({
  minLength: value.length >= 8,
  uppercase: /[A-Z]/.test(value),
  lowercase: /[a-z]/.test(value),
  number: /[0-9]/.test(value),
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
});

const validatePassword = (value: string) => {
  if (!value) return "This field is required";
  const checks = passwordChecks(value);
  if (!checks.minLength || !checks.uppercase || !checks.lowercase || !checks.number || !checks.special) {
    return "Password must meet all requirements below";
  }
  return "";
};

const getPasswordStrength = (value: string): { label: string; color: string; percent: number } => {
  if (!value) return { label: "", color: "", percent: 0 };
  const checks = passwordChecks(value);
  const score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", percent: 25 };
  if (score <= 3) return { label: "Fair", color: "bg-orange-500", percent: 50 };
  if (score <= 4) return { label: "Good", color: "bg-yellow-500", percent: 75 };
  return { label: "Strong", color: "bg-primary", percent: 100 };
};

const PasswordCheck = ({ met, label }: { met: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 text-xs">
    {met ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />}
    <span className={met ? "text-primary" : "text-muted-foreground/60"}>{label}</span>
  </div>
);

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState(searchParams.get("role") || "user");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const errors = useMemo(() => ({
    fullName: validateFullName(fullName),
    username: selectedRole === "user" ? validateUsername(username) : "",
    email: validateEmail(email),
    password: validatePassword(password),
  }), [fullName, username, email, password, selectedRole]);

  const pwChecks = useMemo(() => passwordChecks(password), [password]);
  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  const isFormValid = !errors.fullName && !errors.email && !errors.password &&
    (selectedRole !== "user" || !errors.username);

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all touched
    setTouched({ fullName: true, username: true, email: true, password: true });
    if (!isFormValid) return;

    setLoading(true);
    const { error } = await signUp(email, password, fullName.trim(), selectedRole, username);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm.");
      navigate("/login?role=" + selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar minimal />
      <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="FitExtremes" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
              Join FitExtremes
            </h1>
            <p className="mt-2 text-muted-foreground">Choose your role and get started</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-card space-y-5">
            {/* Role selector */}
            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      selectedRole === r.value
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-secondary hover:border-muted-foreground"
                    }`}
                  >
                    <span className={`block font-display text-xs uppercase tracking-wider ${selectedRole === r.value ? "text-primary" : "text-foreground"}`}>
                      {r.label}
                    </span>
                    <span className="block mt-1 text-[10px] text-muted-foreground">{r.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName")}
                className={touched.fullName && errors.fullName ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {touched.fullName && errors.fullName && (
                <p className="text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Username (Social User only) */}
            {selectedRole === "user" && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                <Input
                  id="username"
                  placeholder="john_smith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleBlur("username")}
                  className={touched.username && errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {touched.username && errors.username && (
                  <p className="text-xs text-red-500">{errors.username}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                className={touched.email && errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={`pr-10 ${touched.password && errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
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

              {/* Password strength bar */}
              {password && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                        style={{ width: `${pwStrength.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12">{pwStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <PasswordCheck met={pwChecks.minLength} label="8+ characters" />
                    <PasswordCheck met={pwChecks.uppercase} label="Uppercase (A-Z)" />
                    <PasswordCheck met={pwChecks.lowercase} label="Lowercase (a-z)" />
                    <PasswordCheck met={pwChecks.number} label="Number (0-9)" />
                    <PasswordCheck met={pwChecks.special} label="Special char (@#$...)" />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button variant="hero" className="w-full" size="lg" type="submit" disabled={loading || !isFormValid}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            {selectedRole !== "user" && (
              <p className="text-center text-xs text-muted-foreground">
                🎉 First month free! Then {selectedRole === "trainer" ? "$15" : "$30"}/month.
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to={`/login?role=${selectedRole}`} className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
