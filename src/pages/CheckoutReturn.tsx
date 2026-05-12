import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";

const CheckoutReturn = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { isBusiness } = useUserRole();
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["my-subscription"] });
  }, [qc]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8 shadow-card"
      >
        <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
        <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
          Payment Complete
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your subscription is being activated. This may take a few seconds.
        </p>
        {sessionId && (
          <p className="text-[10px] text-muted-foreground mt-3 break-all opacity-60">
            Ref: {sessionId}
          </p>
        )}
        <Button
          variant="hero" className="w-full mt-6"
          onClick={() => navigate(isBusiness ? "/business-dashboard" : "/trainer-dashboard")}
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
};

export default CheckoutReturn;
