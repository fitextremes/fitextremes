import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MAX_CYCLE_DAYS, MIN_CYCLE_DAYS } from "@/hooks/useCycleFit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: number | null;
  onSave: (days: number) => Promise<{ error: unknown }>;
}

const AvgCycleDialog = ({ open, onOpenChange, currentValue, onSave }: Props) => {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(currentValue ? String(currentValue) : "");
  }, [open, currentValue]);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      toast.error("Enter your cycle length as a whole number of days");
      return;
    }
    const days = Number(trimmed);
    if (days < MIN_CYCLE_DAYS || days > MAX_CYCLE_DAYS) {
      toast.error(`Cycle length must be between ${MIN_CYCLE_DAYS} and ${MAX_CYCLE_DAYS} days`);
      return;
    }
    setSaving(true);
    const { error } = await onSave(days);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your cycle length");
      return;
    }
    toast.success("Average cycle length saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">Avg Cycle</DialogTitle>
          <DialogDescription>
            Your usual cycle length in days. We use it to estimate your next period, counting from
            the first day of your most recent period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cf-avg-cycle">Cycle length (days)</Label>
          <Input
            id="cf-avg-cycle"
            inputMode="numeric"
            placeholder="e.g. 28"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="hero" className="w-full" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvgCycleDialog;
