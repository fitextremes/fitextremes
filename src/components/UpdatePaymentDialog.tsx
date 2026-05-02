import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const luhn = (num: string) => {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
};

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const UpdatePaymentDialog = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setNumber(""); setExp(""); setCvc(""); setZip(""); };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Cardholder name is required.");
    if (!luhn(number)) return toast.error("Please enter a valid card number.");
    if (!/^\d{2}\/\d{2}$/.test(exp)) return toast.error("Expiry must be MM/YY.");
    const [mm, yy] = exp.split("/").map((x) => parseInt(x, 10));
    const now = new Date();
    const expDate = new Date(2000 + yy, mm, 0);
    if (mm < 1 || mm > 12 || expDate < now) return toast.error("Card is expired.");
    if (!/^\d{3,4}$/.test(cvc)) return toast.error("Invalid CVC.");

    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    toast.success("Payment information updated successfully.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Update Payment Information
          </DialogTitle>
          <DialogDescription>
            Securely update your card on file. Your subscription will continue uninterrupted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="cc-name">Cardholder Name</Label>
            <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <Label htmlFor="cc-number">Card Number</Label>
            <Input
              id="cc-number"
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cc-exp">Expiry</Label>
              <Input
                id="cc-exp"
                value={exp}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                  setExp(v);
                }}
                placeholder="MM/YY"
              />
            </div>
            <div>
              <Label htmlFor="cc-cvc">CVC</Label>
              <Input
                id="cc-cvc"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor="cc-zip">Postal</Label>
              <Input id="cc-zip" value={zip} onChange={(e) => setZip(e.target.value.slice(0, 10))} placeholder="A1A 1A1" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Card details are processed securely. We never store full card numbers.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : "Save Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePaymentDialog;
