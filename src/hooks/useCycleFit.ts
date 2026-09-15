import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Flow = "light" | "medium" | "heavy";

export interface CycleLog {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  is_ongoing: boolean;
  flow: Flow;
  symptoms: string[];
  notes: string | null;
}

export const SYMPTOM_OPTIONS = [
  "Cramps",
  "Bloating",
  "Fatigue",
  "Headache",
  "Back Pain",
  "Breast Tenderness",
  "Mood Changes",
  "Cravings",
  "Acne",
  "Trouble Sleeping",
  "Low Energy",
  "Other",
];

export const toDate = (value: string) => parseISO(`${value.slice(0, 10)}T00:00:00`);

export interface CycleStats {
  cycleDay: number | null;
  nextPeriod: Date | null;
  avgCycle: number | null;
  avgPeriod: number | null;
  cycleLengths: Map<string, number>;
  periodDurations: Map<string, number>;
}

export const useCycleFit = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cycle_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });
    if (!error) setLogs(((data || []) as unknown as CycleLog[]));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
    else {
      setLogs([]);
      setLoading(false);
    }
  }, [user, load]);

  const stats = useMemo<CycleStats>(() => {
    // logs are newest-first; build an oldest-first copy for cycle math
    const asc = [...logs].sort((a, b) => a.start_date.localeCompare(b.start_date));

    const cycleLengths = new Map<string, number>();
    for (let i = 0; i < asc.length - 1; i++) {
      const len = differenceInCalendarDays(toDate(asc[i + 1].start_date), toDate(asc[i].start_date));
      if (len > 0 && len < 200) cycleLengths.set(asc[i].id, len);
    }

    const periodDurations = new Map<string, number>();
    for (const log of asc) {
      if (log.end_date && !log.is_ongoing) {
        const days = differenceInCalendarDays(toDate(log.end_date), toDate(log.start_date)) + 1;
        if (days > 0 && days < 30) periodDurations.set(log.id, days);
      }
    }

    const avg = (values: number[]) =>
      values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null;

    const avgCycle = avg([...cycleLengths.values()]);
    const avgPeriod = avg([...periodDurations.values()]);

    const latest = asc[asc.length - 1];
    let cycleDay: number | null = null;
    let nextPeriod: Date | null = null;
    if (latest) {
      const diff = differenceInCalendarDays(new Date(), toDate(latest.start_date));
      if (diff >= 0) cycleDay = diff + 1;
      if (avgCycle) nextPeriod = addDays(toDate(latest.start_date), avgCycle);
    }

    return { cycleDay, nextPeriod, avgCycle, avgPeriod, cycleLengths, periodDurations };
  }, [logs]);

  return { logs, loading, reload: load, stats };
};
