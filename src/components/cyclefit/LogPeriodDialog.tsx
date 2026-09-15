import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CycleLog, Flow, SYMPTOM_OPTIONS } from "@/hooks/useCycleFit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: CycleLog | null;
  defaultStart?: string;
  onSaved: () => void;
}

const LogPeriodDialog = ({ open, onOpenChange, editing, defaultStart, onSaved }: Props) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ongoing, setOngoing] = useState(false);
  const [flow, setFlow] = useState<Flow>("medium");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStartDate(editing?.start_date?.slice(0, 10) || defaultStart || "");
    setEndDate(editing?.end_date?.slice(0, 10) || "");
    setOngoing(editing?.is_ongoing ?? false);
    setFlow((editing?.flow as Flow) || "medium");
    setSymptoms(editing?.symptoms || []);
    setNotes(editing?.notes || "");
  }, [open, editing, defaultStart]);

  const toggleSymptom = (symptom: string) =>
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );

  const handleSave = async () => {
    if (!user) return;
    if (!startDate) {
      toast.error("Period start date is required");
      return;
    }
    if (!ongoing && endDate && endDate < startDate) {
      toast.error("End date can't be before the start date");
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      start_date: startDate,
      end_date: ongoing ? null : endDate || null,
      is_ongoing: ongoing,
      flow,
      symptoms,
      notes: notes.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("cycle_logs").update(payload).eq("id", editing.id)
      : await supabase.from("cycle_logs").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Couldn't save this period");
      return;
    }
    toast.success(editing ? "Period updated" : "Period logged");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">
            {editing ? "Edit Period" : "Log Period"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cf-start">Period Start Date *</Label>
            <Input
              id="cf-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-end">Period End Date</Label>
            <Input
              id="cf-end"
              type="date"
              value={endDate}
              disabled={ongoing}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="cf-ongoing"
                checked={ongoing}
                onCheckedChange={(v) => {
                  setOngoing(!!v);
                  if (v) setEndDate("");
                }}
              />
              <Label htmlFor="cf-ongoing" className="text-sm font-normal text-muted-foreground">
                Still ongoing
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Flow</Label>
            <RadioGroup
              value={flow}
              onValueChange={(v) => setFlow(v as Flow)}
              className="flex flex-wrap gap-4"
            >
              {(["light", "medium", "heavy"] as Flow[]).map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <RadioGroupItem value={f} id={`cf-flow-${f}`} />
                  <Label htmlFor={`cf-flow-${f}`} className="font-normal capitalize">
                    {f}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Symptoms</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <button
                  type="button"
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    symptoms.includes(symptom)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-notes">Notes</Label>
            <Textarea
              id="cf-notes"
              rows={3}
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="hero" className="w-full" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Period"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogPeriodDialog;
