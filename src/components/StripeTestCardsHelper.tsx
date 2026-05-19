import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, CreditCard, ChevronDown, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPaymentsTestMode } from "@/lib/stripe";
import { toast } from "sonner";

const TEST_CARDS = [
  { label: "Successful payment", number: "4242 4242 4242 4242", tone: "success" as const },
  { label: "Declined payment", number: "4000 0000 0000 0002", tone: "danger" as const },
  { label: "Insufficient funds", number: "4000 0000 0000 9995", tone: "warning" as const },
];

export function StripeTestCardsHelper() {
  if (!isPaymentsTestMode()) return null;
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num.replace(/\s/g, ""));
      setCopied(num);
      toast.success("Test card copied");
      setTimeout(() => setCopied((c) => (c === num ? null : c)), 1500);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Test mode is active</p>
            <p className="text-xs text-muted-foreground leading-tight">
              Use a Stripe test card below — real cards will be declined.
            </p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-4 pb-4 space-y-2"
          >
            {TEST_CARDS.map((c) => (
              <div
                key={c.number}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CreditCard
                    className={`h-4 w-4 shrink-0 ${
                      c.tone === "success" ? "text-primary" : c.tone === "danger" ? "text-destructive" : "text-accent"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground leading-tight">{c.label}</p>
                    <p className="text-sm font-mono text-foreground leading-tight truncate">{c.number}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => copy(c.number)}>
                  {copied === c.number ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}

            <div className="text-xs text-muted-foreground pt-1 leading-relaxed">
              Any future expiry · any 3-digit CVC · any postal code.{" "}
              <a
                href="https://docs.stripe.com/testing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 underline text-primary"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
