import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.png";

const roles = [
  { value: "user", label: "Social User", description: "Explore gyms, trainers & connect", price: "Free" },
  { value: "trainer", label: "Personal Trainer", description: "Showcase services & receive leads", price: "$15/mo" },
  { value: "business", label: "Business Owner", description: "List your gym, studio or store", price: "$30/mo" },
];

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState(searchParams.get("role") || "user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will integrate with backend
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
            {/* Role Selection */}
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

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>

            <Button variant="hero" className="w-full" size="lg" type="submit">
              Create Account
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
