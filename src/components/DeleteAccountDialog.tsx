import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Step = "warn" | "verify" | "confirm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountDialog = ({ open, onOpenChange }: Props) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("warn");
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  const reset = () => {
    setStep("warn");
    setPassword("");
    setTyped("");
    setFeedback("");
    setVerifiedToken(null);
    setLoading(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const verifyPassword = async () => {
    if (!user?.email || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Incorrect password", description: error.message, variant: "destructive" });
      return;
    }
    if (!data.session?.access_token) {
      toast({
        title: "Verification failed",
        description: "Your session could not be refreshed. Please log in again and retry.",
        variant: "destructive",
      });
      return;
    }
    setVerifiedToken(data.session.access_token);
    setStep("confirm");
  };

  const handleDelete = async () => {
    if (typed !== "DELETE" || loading) return;
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = verifiedToken ?? session?.access_token;

      if (!accessToken) {
        toast({
          title: "Session expired",
          description: "Please verify your password again before deleting your account.",
          variant: "destructive",
        });
        setStep("verify");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { feedback: feedback || null },
      });
      if (error || (data as any)?.error) {
        const msg =
          (data as any)?.error ||
          error?.message ||
          "Unable to delete account. Please try again.";
        console.error("[DeleteAccount] failed:", error, data);

        if (/unauthorized|jwt|session/i.test(msg)) {
          setStep("verify");
          setVerifiedToken(null);
          toast({
            title: "Please verify again",
            description: "Your session expired during deletion. Re-enter your password and try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({ title: "Unable to delete account", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      // Best-effort signOut + always clear local session
      try { await signOut(); } catch (_) { /* ignore */ }
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
          .forEach((k) => localStorage.removeItem(k));
      } catch (_) { /* ignore */ }
      reset();
      onOpenChange(false);
      navigate("/", { replace: true });
    } catch (e: any) {
      console.error("[DeleteAccount] exception:", e);
      toast({
        title: "Unable to delete account",
        description: e?.message || "Unexpected error. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };


  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        {step === "warn" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Delete Account
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Are you sure you want to permanently delete your FitExtremes account?
                    This action <span className="font-semibold text-foreground">cannot be undone.</span>
                  </p>
                  <p>Deleting your account will remove:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Profile information</li>
                    <li>Workout & nutrition history</li>
                    <li>Uploaded photos</li>
                    <li>Posts, comments & reactions</li>
                    <li>Trainer / business profile & gallery</li>
                    <li>Followers, follows & notifications</li>
                    <li>Subscription access</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setStep("verify")}>Continue</Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Verify your identity</AlertDialogTitle>
              <AlertDialogDescription>
                Please enter your password to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="del-pwd">Password</Label>
              <Input
                id="del-pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
              />
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setStep("warn")} disabled={loading}>Back</Button>
              <Button variant="destructive" onClick={verifyPassword} disabled={!password || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Verify
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Final confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Type <span className="font-mono font-bold text-foreground">DELETE</span> below to permanently remove your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type DELETE"
                autoFocus
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Why are you leaving? (optional)
                </Label>
                <Input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Privacy, pricing, technical issues..."
                  maxLength={500}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setStep("warn")} disabled={loading}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={typed !== "DELETE" || loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Permanently Delete My Account
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
