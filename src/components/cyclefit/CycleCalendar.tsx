import { useMemo } from "react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CycleLog, toDate } from "@/hooks/useCycleFit";

interface Props {
  month: Date;
  onMonthChange: (date: Date) => void;
  logs: CycleLog[];
  nextPeriod: Date | null;
  avgPeriod: number | null;
  onSelectLog: (log: CycleLog) => void;
}

const CycleCalendar = ({ month, onMonthChange, logs, nextPeriod, avgPeriod, onSelectLog }: Props) => {
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  const logForDay = (day: Date) =>
    logs.find((log) => {
      const start = toDate(log.start_date);
      const end = log.is_ongoing || !log.end_date ? new Date() : toDate(log.end_date);
      return differenceInCalendarDays(day, start) >= 0 && differenceInCalendarDays(end, day) >= 0;
    });

  const estimatedDays = useMemo(() => {
    if (!nextPeriod) return [] as Date[];
    const length = avgPeriod ?? 5;
    return Array.from({ length }, (_, i) => addDays(nextPeriod, i));
  }, [nextPeriod, avgPeriod]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-display uppercase tracking-wider">{format(month, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const log = logForDay(day);
            const isEstimated = !log && estimatedDays.some((d) => isSameDay(d, day));
            const isToday = isSameDay(day, new Date());
            const hasSymptoms = !!log && log.symptoms.length > 0;
            const outside = !isSameMonth(day, month);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={!log}
                onClick={() => log && onSelectLog(log)}
                className={`relative aspect-square rounded-md text-xs transition-colors ${
                  log
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isEstimated
                      ? "border border-dashed border-primary/60 text-primary"
                      : outside
                        ? "text-muted-foreground/40"
                        : "text-foreground hover:bg-secondary"
                } ${isToday ? "ring-2 ring-accent" : ""}`}
              >
                {format(day, "d")}
                {hasSymptoms && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-primary" /> Logged period
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-primary/60" /> Estimated period
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-accent" /> Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Symptom logged
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CycleCalendar;
