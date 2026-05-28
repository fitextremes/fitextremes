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

type Step = "warn" | "verify";
type Phase = "idle" | "deleting";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountDialog = ({ open, onOpenChange }: Props) => {
  const { user, session } = useAuth();
  const [step, setStep] = useState<Step>("warn");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const loading = phase !== "idle";

  const reset = () => {
    setStep("warn");
    setPassword("");
    setFeedback("");
    setPhase("idle");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && loading) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const deleteAccount = async () => {
    const accessToken = session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;

    if (!accessToken) {
      toast({
        title: "Session expired",
        description: "Please log in again, then retry deleting your account.",
        variant: "destructive",
      });
      return false;
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, feedback: feedback || null }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data as any)?.error) {
      const message =
        (data as any)?.error ||
        response.statusText ||
        "Unable to delete account. Please try again.";

      console.error("[DeleteAccount] failed:", response.status, data);

      if (response.status === 401 && /incorrect password/i.test(message)) {
        toast({
          title: "Incorrect password",
          description: "The password you entered is incorrect.",
          variant: "destructive",
        });
        return false;
      }

      if (/unauthorized|jwt|session/i.test(message)) {
        toast({
          title: "Session expired",
          description: "Please log in again, then retry deleting your account.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Unable to delete account",
        description: message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
    });

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.warn("[DeleteAccount] local sign out failed:", error);
    }

    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("sb-") || key.includes("supabase"))
        .forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("[DeleteAccount] local storage cleanup failed:", error);
    }

    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn("[DeleteAccount] session storage cleanup failed:", error);
    }

    reset();
    onOpenChange(false);

    window.location.replace("/");
    return true;
  };

  const handleVerifyAndDelete = async () => {
    if (!user?.email || !password || loading) return;

    try {
      setPhase("deleting");
      await deleteAccount();
    } catch (error: any) {
      console.error("[DeleteAccount] exception:", error);
      toast({
        title: "Unable to delete account",
        description: error?.message || "Unexpected error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPhase("idle");
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
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button variant="destructive" onClick={() => setStep("verify")} disabled={loading}>Continue</Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Verify your identity</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your password once to verify and permanently delete your account.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="del-pwd">Password</Label>
                <Input
                  id="del-pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyAndDelete()}
                />
              </div>

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
              <Button variant="outline" onClick={() => setStep("warn")} disabled={loading}>Back</Button>
              <Button variant="destructive" onClick={handleVerifyAndDelete} disabled={!password || loading}>
                {phase !== "idle" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {phase === "deleting" ? "Deleting account..." : "Verify & Delete Account"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
