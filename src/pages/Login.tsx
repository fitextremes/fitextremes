import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.png";

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "user";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const roleLabels: Record<string, string> = {
    user: "Social User",
    trainer: "Personal Trainer",
    business: "Business Owner",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will integrate with backend
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button variant="hero" className="w-full" size="lg" type="submit">
              Login
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
