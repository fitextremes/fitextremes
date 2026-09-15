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
  const { role, isSocial, loading: roleLoading } = useUserRole();
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
    if (role && !isSocial) {
      navigate("/");
    }
  }, [user, role, isSocial, authLoading, roleLoading, navigate]);

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

  const handleDeleteDay = async (ids: string[]) => {
    const { error } = await supabase.from("workout_logs").delete().in("id", ids);
    if (error) {
      toast.error("Failed to delete workouts");
      return;
    }
    toast.success("Workout day deleted");
    setLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
  };

  // Group logs by calendar day (newest day first, logs already sorted desc)
  const groupedDays = (() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const log of logs) {
      const key = format(new Date(log.created_at), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  })();

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
          <div className="space-y-6">
            {groupedDays.map(([dayKey, dayLogs]) => (
              <Card key={dayKey}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display uppercase tracking-wider">
                    {format(new Date(dayLogs[0].created_at), "MMMM d, yyyy")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {dayLogs.length} {dayLogs.length === 1 ? "Exercise" : "Exercises"} Logged
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="-mx-2 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-2 py-2 font-medium">Exercise</th>
                          <th className="px-2 py-2 font-medium text-right">Sets</th>
                          <th className="px-2 py-2 font-medium text-right">Reps</th>
                          <th className="px-2 py-2 font-medium text-right">Weight</th>
                          <th className="px-2 py-2 font-medium">Unit</th>
                          <th className="px-2 py-2 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayLogs.map((log) => (
                          <tr key={log.id} className="border-b border-border/50 last:border-0">
                            <td className="px-2 py-3 font-medium text-foreground">{log.exercise_name}</td>
                            <td className="px-2 py-3 text-right text-muted-foreground">{log.sets}</td>
                            <td className="px-2 py-3 text-right text-muted-foreground">{log.reps}</td>
                            <td className="px-2 py-3 text-right text-muted-foreground">{Number(log.weight)}</td>
                            <td className="px-2 py-3 text-muted-foreground">{log.weight_unit}</td>
                            <td className="px-2 py-3 text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Delete ${log.exercise_name}`}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this exercise?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {log.exercise_name} will be removed from this day. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(log.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Entire Day
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this whole workout day?</AlertDialogTitle>
                        <AlertDialogDescription>
                          All {dayLogs.length} exercises logged on{" "}
                          {format(new Date(dayLogs[0].created_at), "MMMM d, yyyy")} will be removed. This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteDay(dayLogs.map((l) => l.id))}>
                          Delete Day
                        </AlertDialogAction>
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
