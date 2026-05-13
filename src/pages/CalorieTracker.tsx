import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, Loader2, Settings, Apple, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

interface FoodResult {
  id: string;
  name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "usda" | "off";
}

interface FoodLog {
  id: string;
  food_name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string | null;
  quantity: number;
  meal_type: MealType;
  source_api: string | null;
  created_at: string;
}

interface Goals {
  calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
}

const DEFAULT_GOALS: Goals = {
  calorie_goal: 2000,
  protein_goal: 150,
  carb_goal: 250,
  fat_goal: 65,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

// Local-time YYYY-MM-DD (avoid UTC offset shifting the day)
const dateToISO = (d: Date) => format(d, "yyyy-MM-dd");

// Parse "2 eggs" / "100g chicken" / "1 cup rice" -> { qty, unit, term }
function parseQuery(raw: string): { quantity: number; term: string } {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(g|grams?|oz|cup|cups|tbsp|tsp|ml|piece|pieces)?\s+(.+)$/i);
  if (m) {
    const qty = parseFloat(m[1]);
    return { quantity: isFinite(qty) && qty > 0 ? qty : 1, term: m[3] };
  }
  return { quantity: 1, term: raw };
}

const CalorieTracker = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSocial, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [parsedQty, setParsedQty] = useState(1);

  const [addModal, setAddModal] = useState<{ food: FoodResult; quantity: number; mealType: MealType } | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [goalsDraft, setGoalsDraft] = useState<Goals>(DEFAULT_GOALS);

  // Redirect non-social users
  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isSocial) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, roleLoading, user, isSocial, navigate]);

  // Load today's logs and goals
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLogsLoading(true);
      const [{ data: logsData }, { data: goalsData }] = await Promise.all([
        supabase
          .from("food_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("logged_date", dateToISO(selectedDate))
          .order("created_at", { ascending: true }),
        supabase.from("nutrition_goals").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      setLogs((logsData ?? []) as FoodLog[]);
      if (goalsData) {
        setGoals({
          calorie_goal: goalsData.calorie_goal,
          protein_goal: goalsData.protein_goal,
          carb_goal: goalsData.carb_goal,
          fat_goal: goalsData.fat_goal,
        });
      }
      setLogsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Debounced food search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const { quantity, term } = parseQuery(query);
    setParsedQty(quantity);
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke("food-search", {
          body: { query: term },
        });
        if (error) throw error;
        setResults((data?.results ?? []) as FoodResult[]);
      } catch (e) {
        console.error(e);
        toast({ title: "Search failed", description: "Please try again.", variant: "destructive" });
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, l) => {
        const q = l.quantity || 1;
        acc.calories += l.calories * q;
        acc.protein += l.protein * q;
        acc.carbs += l.carbs * q;
        acc.fat += l.fat * q;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [logs]);

  const grouped = useMemo(() => {
    const g: Record<MealType, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    logs.forEach((l) => g[l.meal_type].push(l));
    return g;
  }, [logs]);

  const openAddModal = (food: FoodResult) => {
    setAddModal({ food, quantity: parsedQty || 1, mealType: "breakfast" });
  };

  const saveLog = async () => {
    if (!addModal || !user) return;
    const { food, quantity, mealType } = addModal;
    const { data, error } = await supabase
      .from("food_logs")
      .insert({
        user_id: user.id,
        food_name: food.name,
        brand: food.brand ?? null,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving_size: food.serving_size,
        quantity,
        meal_type: mealType,
        source_api: food.source,
        source_id: food.id,
        logged_date: dateToISO(selectedDate),
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Failed to log", description: error.message, variant: "destructive" });
      return;
    }
    setLogs((prev) => [...prev, data as FoodLog]);
    setAddModal(null);
    setQuery("");
    setResults([]);
    toast({ title: "Added", description: `${food.name} logged to ${MEAL_LABELS[mealType]}.` });
  };

  const updateQty = async (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, quantity } : l)));
    await supabase.from("food_logs").update({ quantity }).eq("id", id);
  };

  const deleteLog = async (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    await supabase.from("food_logs").delete().eq("id", id);
  };

  const openGoals = () => {
    setGoalsDraft(goals);
    setGoalsOpen(true);
  };

  const saveGoals = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("nutrition_goals")
      .upsert({ user_id: user.id, ...goalsDraft }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    setGoals(goalsDraft);
    setGoalsOpen(false);
    toast({ title: "Goals updated" });
  };

  if (authLoading || roleLoading || !user || !isSocial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const remaining = Math.max(0, goals.calorie_goal - totals.calories);
  const pct = (n: number, d: number) => Math.min(100, d > 0 ? (n / d) * 100 : 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <SocialTopBar title="Calorie Tracker" />

      <div className="container mx-auto max-w-2xl px-4 pt-20 pb-8 space-y-6">
        {/* Daily Summary */}
        <Card className="sticky top-16 z-30 border-primary/30 bg-card/95 backdrop-blur">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display uppercase tracking-wider text-base flex items-center gap-2">
              <Apple className="h-5 w-5 text-primary" />
              Today
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={openGoals}>
              <Settings className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-display text-foreground">
                  {Math.round(totals.calories)}
                  <span className="text-sm text-muted-foreground"> / {goals.calorie_goal} kcal</span>
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {Math.round(remaining)} remaining
                </p>
              </div>
            </div>
            <Progress value={pct(totals.calories, goals.calorie_goal)} className="h-2" />

            <div className="grid grid-cols-3 gap-3 pt-1">
              {([
                ["Protein", totals.protein, goals.protein_goal, "g"],
                ["Carbs", totals.carbs, goals.carb_goal, "g"],
                ["Fat", totals.fat, goals.fat_goal, "g"],
              ] as const).map(([label, val, goal, unit]) => (
                <div key={label} className="rounded-lg border border-border bg-muted/30 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {Math.round(val)}
                    <span className="text-muted-foreground text-xs">/{goal}{unit}</span>
                  </p>
                  <Progress value={pct(val, goal)} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods like chicken breast, oatmeal, Tim Hortons bagel…"
                className="pl-10"
              />
            </div>

            {searching && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results.</p>
            )}

            {!searching && results.length > 0 && (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card/60 p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{r.name}</p>
                      {r.brand && <p className="text-xs text-muted-foreground line-clamp-1">{r.brand}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.serving_size} • {Math.round(r.calories)} kcal • P {Math.round(r.protein)}g • C{" "}
                        {Math.round(r.carbs)}g • F {Math.round(r.fat)}g
                      </p>
                    </div>
                    <Button size="sm" variant="default" onClick={() => openAddModal(r)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal sections */}
        {logsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          (Object.keys(MEAL_LABELS) as MealType[]).map((meal) => {
            const items = grouped[meal];
            const subTotal = items.reduce((s, l) => s + l.calories * (l.quantity || 1), 0);
            return (
              <Card key={meal}>
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="font-display uppercase tracking-wider text-sm">
                    {MEAL_LABELS[meal]}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{Math.round(subTotal)} kcal</span>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No items yet.</p>
                  ) : (
                    items.map((l) => (
                      <div key={l.id} className="flex items-center gap-2 rounded-md border border-border/60 p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-1">{l.food_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.serving_size} • {Math.round(l.calories * (l.quantity || 1))} kcal
                          </p>
                        </div>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={l.quantity}
                          onChange={(e) => updateQty(l.id, parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 text-sm"
                        />
                        <Button size="icon" variant="ghost" onClick={() => deleteLog(l.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Grand totals */}
        <Card className="border-accent/40">
          <CardContent className="pt-6 grid grid-cols-4 gap-3 text-center">
            {[
              ["Cal", Math.round(totals.calories)],
              ["P", Math.round(totals.protein) + "g"],
              ["C", Math.round(totals.carbs) + "g"],
              ["F", Math.round(totals.fat) + "g"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{k}</p>
                <p className="text-base font-semibold text-foreground">{v}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <MobileTabBar />

      {/* Add to log modal */}
      <Dialog open={!!addModal} onOpenChange={(o) => !o && setAddModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Add to Log</DialogTitle>
          </DialogHeader>
          {addModal && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{addModal.food.name}</p>
                <p className="text-xs text-muted-foreground">
                  Per {addModal.food.serving_size}: {Math.round(addModal.food.calories)} kcal
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={addModal.quantity}
                    onChange={(e) =>
                      setAddModal({ ...addModal, quantity: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Meal</Label>
                  <Select
                    value={addModal.mealType}
                    onValueChange={(v) => setAddModal({ ...addModal, mealType: v as MealType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {MEAL_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Total: {Math.round(addModal.food.calories * addModal.quantity)} kcal • P{" "}
                {Math.round(addModal.food.protein * addModal.quantity)}g • C{" "}
                {Math.round(addModal.food.carbs * addModal.quantity)}g • F{" "}
                {Math.round(addModal.food.fat * addModal.quantity)}g
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveLog} disabled={!addModal || addModal.quantity <= 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goals modal */}
      <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">Daily Goals</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["Calories", "calorie_goal"],
              ["Protein (g)", "protein_goal"],
              ["Carbs (g)", "carb_goal"],
              ["Fat (g)", "fat_goal"],
            ] as const).map(([label, key]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={goalsDraft[key]}
                  onChange={(e) =>
                    setGoalsDraft({ ...goalsDraft, [key]: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGoalsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveGoals}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalorieTracker;
