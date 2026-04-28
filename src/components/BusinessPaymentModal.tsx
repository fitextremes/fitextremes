import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Loader2 } from "lucide-react";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const formatCardNumber = (raw: string) => {
  const digits = onlyDigits(raw).slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const detectBrand = (digits: string): "visa" | "mastercard" | "amex" | null => {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return null;
};

const luhn = (digits: string) => {
  if (digits.length < 13) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

const BusinessPaymentModal = ({ open, onOpenChange, onConfirm, loading }: Props) => {
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const digits = onlyDigits(card);
  const brand = detectBrand(digits);

  const cardError = useMemo(() => {
    if (!digits) return "Enter valid card number";
    if (!/^\d+$/.test(digits)) return "Card number must be numeric";
    if (digits.length < 13 || digits.length > 19) return "Enter valid card number";
    if (!luhn(digits)) return "Invalid card number";
    return "";
  }, [digits]);

  const expError = useMemo(() => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return "Enter expiry in MM/YY";
    const [mm, yy] = exp.split("/").map((s) => parseInt(s, 10));
    if (mm < 1 || mm > 12) return "Invalid month";
    const now = new Date();
    const expDate = new Date(2000 + yy, mm); // first day of month after
    if (expDate <= now) return "Card has expired";
    return "";
  }, [exp]);

  const cvcError = useMemo(() => {
    const expected = brand === "amex" ? 4 : 3;
    if (!/^\d+$/.test(cvc)) return "Enter valid CVC";
    if (cvc.length !== expected) return "Enter valid CVC";
    return "";
  }, [cvc, brand]);

  const valid = !cardError && !expError && !cvcError;

  const handleExp = (v: string) => {
    let d = onlyDigits(v).slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2);
    setExp(d);
  };

  const submit = async () => {
    setTouched({ card: true, exp: true, cvc: true });
    if (!valid) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">1-Month Free Trial</DialogTitle>
          <DialogDescription>
            Start your free trial now. Billing begins after trial unless cancelled before expiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Card Number</Label>
            <div className="relative">
              <Input
                value={card}
                onChange={(e) => setCard(formatCardNumber(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, card: true }))}
                placeholder="1234 1234 1234 1234"
                inputMode="numeric"
                className={touched.card && cardError ? "border-destructive pr-16" : "pr-16"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-muted-foreground">
                {brand ?? ""}
              </span>
            </div>
            {touched.card && cardError && <p className="text-xs text-destructive">{cardError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expiry (MM/YY)</Label>
              <Input
                value={exp}
                onChange={(e) => handleExp(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, exp: true }))}
                placeholder="MM/YY"
                inputMode="numeric"
                className={touched.exp && expError ? "border-destructive" : ""}
              />
              {touched.exp && expError && <p className="text-xs text-destructive">{expError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>CVC</Label>
              <Input
                value={cvc}
                onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))}
                onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
                placeholder={brand === "amex" ? "1234" : "123"}
                inputMode="numeric"
                className={touched.cvc && cvcError ? "border-destructive" : ""}
              />
              {touched.cvc && cvcError && <p className="text-xs text-destructive">{cvcError}</p>}
            </div>
          </div>

          <div className="rounded-lg bg-secondary/50 border border-border p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>This is a mock checkout — no real charge. We do not store card data. Stripe integration is coming soon.</span>
          </div>

          <Button variant="hero" className="w-full" disabled={!valid || loading} onClick={submit}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting trial...</> : <><CreditCard className="h-4 w-4 mr-2" /> Start Free Trial</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessPaymentModal;
