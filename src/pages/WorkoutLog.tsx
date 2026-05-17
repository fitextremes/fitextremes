import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Dumbbell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WorkoutLog {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  weight_unit: "lbs" | "kg";
  created_at: string;
}

const WorkoutLogPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSocial, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [saving, setSaving] = useState(false);

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isSocial) {
      navigate("/");
    }
  }, [user, isSocial, authLoading, roleLoading, navigate]);

  const loadLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load workouts");
    } else {
      setLogs((data || []) as WorkoutLog[]);
    }
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (user && isSocial) loadLogs();
  }, [user, isSocial]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const name = exerciseName.trim();
    const setsNum = parseInt(sets, 10);
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight || "0");

    if (!name) return toast.error("Exercise name is required");
    if (!setsNum || setsNum <= 0) return toast.error("Sets must be greater than 0");
    if (!repsNum || repsNum <= 0) return toast.error("Reps must be greater than 0");
    if (isNaN(weightNum) || weightNum < 0) return toast.error("Weight must be 0 or greater");

    setSaving(true);
    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      exercise_name: name,
      sets: setsNum,
      reps: repsNum,
      weight: weightNum,
      weight_unit: weightUnit,
    });
    setSaving(false);

    if (error) {
      toast.error("Failed to save workout");
      return;
    }
    toast.success("Workout saved successfully");
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    loadLogs();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workout_logs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete workout");
      return;
    }
    toast.success("Workout deleted");
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  if (authLoading || roleLoading || !user || !isSocial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider">Workout Log</h1>
            <p className="text-sm text-muted-foreground">Track your training, one set at a time.</p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Log a Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise">Exercise Name</Label>
                <Input
                  id="exercise"
                  placeholder="e.g. Bench Press"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="3"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="10"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    placeholder="135"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <ToggleGroup
                    type="single"
                    value={weightUnit}
                    onValueChange={(v) => v && setWeightUnit(v as "lbs" | "kg")}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="lbs" variant="outline" className="px-6">lbs</ToggleGroupItem>
                    <ToggleGroupItem value="kg" variant="outline" className="px-6">kg</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Workout"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-lg font-display uppercase tracking-wider mb-3">Workout History</h2>

        {loadingLogs ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No workouts logged yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{log.exercise_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.sets} Sets • {log.reps} Reps • {Number(log.weight)} {log.weight_unit}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Logged {format(new Date(log.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(log.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default WorkoutLogPage;
