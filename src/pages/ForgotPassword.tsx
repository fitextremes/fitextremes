import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("A reset password link has been sent to your email ID.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar minimal />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="FitExtremes" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
              Forgot Password
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>.
                Click the link in the email to reset your password.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-primary hover:underline">try again</button>.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 shadow-card space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button variant="hero" className="w-full" size="lg" type="submit" disabled={loading || !email.trim()}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline">Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
