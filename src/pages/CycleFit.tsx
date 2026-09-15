import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarHeart, Plus, Pencil, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { CycleLog, toDate, useCycleFit } from "@/hooks/useCycleFit";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import LogPeriodDialog from "@/components/cyclefit/LogPeriodDialog";
import CycleCalendar from "@/components/cyclefit/CycleCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NOT_ENOUGH = "Not enough data yet";

const SummaryCard = ({
  label,
  value,
  muted,
  onClick,
}: {
  label: string;
  value: string;
  muted?: boolean;
  onClick?: () => void;
}) => {
  const body = (
    <CardContent className="p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">{label}</p>
      <p
        className={`mt-1 font-display uppercase tracking-wide ${
          muted ? "text-sm text-muted-foreground" : "text-lg text-primary"
        }`}
      >
        {value}
      </p>
    </CardContent>
  );
  return onClick ? (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="cursor-pointer transition-colors hover:border-primary/60"
    >
      {body}
    </Card>
  ) : (
    <Card>{body}</Card>
  );
};

const CycleFit = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, isSocial, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const { logs, loading, reload, stats, avgCycleSetting, saveAvgCycle } = useCycleFit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [avgDialogOpen, setAvgDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CycleLog | null>(null);
  const [deleting, setDeleting] = useState<CycleLog | null>(null);
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (role && !isSocial) navigate("/");
  }, [user, role, isSocial, authLoading, roleLoading, navigate]);

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("cycle_logs").delete().eq("id", deleting.id);
    setDeleting(null);
    if (error) {
      toast.error("Couldn't delete this entry");
      return;
    }
    toast.success("Entry deleted");
    reload();
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (log: CycleLog) => {
    setEditing(log);
    setDialogOpen(true);
  };

  // General, non-medical wellness note based on where the user is in their cycle
  const cycleNote = (() => {
    const latest = logs[0];
    if (!latest) return null;
    const onPeriod =
      differenceInCalendarDays(new Date(), toDate(latest.start_date)) >= 0 &&
      (latest.is_ongoing ||
        (latest.end_date && differenceInCalendarDays(toDate(latest.end_date), new Date()) >= 0));
    return onPeriod
      ? {
          title: "Period",
          text: "Energy levels can vary. Adjust workout intensity based on how you feel.",
        }
      : {
          title: "After Period",
          text: "You may feel ready to gradually increase training intensity.",
        };
  })();

  if (authLoading || roleLoading || !user || !isSocial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 pb-24 pt-24 md:pb-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CalendarHeart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl uppercase tracking-wider md:text-3xl">CycleFit</h1>
            <p className="text-sm text-muted-foreground">
              Track your cycle. Understand your body. Train smarter.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading your cycle data...</p>
        ) : logs.length === 0 ? (
          <Card className="text-center">
            <CardContent className="p-8">
              <h2 className="font-display text-xl uppercase tracking-wider">Welcome to CycleFit</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                Start by logging your most recent period. As you add more cycles, CycleFit can show
                your cycle history and estimated upcoming dates.
              </p>
              <Button variant="hero" className="mt-6" onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" /> Log Your First Period
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryCard
                label="Cycle Day"
                value={stats.cycleDay ? `Day ${stats.cycleDay}` : NOT_ENOUGH}
              />
              <SummaryCard
                label="Next Period"
                muted={!stats.nextPeriod}
                value={
                  stats.nextPeriod
                    ? `Est. ${format(stats.nextPeriod, "MMM d, yyyy")}`
                    : !stats.lastStart
                      ? "Log your period to calculate"
                      : "Set Avg Cycle to estimate"
                }
                onClick={!stats.nextPeriod && stats.lastStart ? () => setAvgDialogOpen(true) : undefined}
              />
              <SummaryCard
                label="Avg. Cycle"
                muted={!stats.avgCycle}
                value={stats.avgCycle ? `${stats.avgCycle} Days` : "Set cycle length"}
                onClick={() => setAvgDialogOpen(true)}
              />
              <SummaryCard
                label="Avg. Period"
                value={stats.avgPeriod ? `${stats.avgPeriod} Days` : NOT_ENOUGH}
              />
            </div>

            {stats.loggedAvgCycle && stats.loggedAvgCycle !== stats.avgCycle && (
              <Card className="mt-3">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-sm text-muted-foreground">
                    Your logged-cycle average: {stats.loggedAvgCycle} days
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { error } = await saveAvgCycle(stats.loggedAvgCycle!);
                      if (error) toast.error("Couldn't update your cycle length");
                      else toast.success(`Using ${stats.loggedAvgCycle} days for predictions`);
                    }}
                  >
                    Use {stats.loggedAvgCycle} days for predictions
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" className="flex-1" onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" /> Log Period
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setAvgDialogOpen(true)}>
                <Settings2 className="mr-1 h-4 w-4" />
                {stats.avgCycle ? `Avg Cycle: ${stats.avgCycle} Days` : "Set Avg Cycle"}
              </Button>
            </div>


            <div className="mt-6">
              <CycleCalendar
                month={month}
                onMonthChange={setMonth}
                logs={logs}
                nextPeriod={stats.nextPeriod}
                avgPeriod={stats.avgPeriod}
                onSelectLog={openEdit}
              />
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="font-display text-base uppercase tracking-wider">
                  Cycle History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Period Started</th>
                        <th className="px-4 py-2 font-medium">Duration</th>
                        <th className="px-4 py-2 font-medium">Cycle Length</th>
                        <th className="px-4 py-2 font-medium">Flow</th>
                        <th className="px-4 py-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const duration = stats.periodDurations.get(log.id);
                        const cycleLength = stats.cycleLengths.get(log.id);
                        return (
                          <tr key={log.id} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-3">{format(toDate(log.start_date), "MMM d, yyyy")}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {log.is_ongoing ? "Ongoing" : duration ? `${duration} days` : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {cycleLength ? `${cycleLength} days` : "—"}
                            </td>
                            <td className="px-4 py-3 capitalize text-muted-foreground">{log.flow}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(log)} aria-label="Edit entry">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleting(log)} aria-label="Delete entry">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {cycleNote && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="font-display text-base uppercase tracking-wider">
                    Cycle &amp; Fitness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-primary">{cycleNote.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{cycleNote.text}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          CycleFit provides estimates based on the information you log. Cycle predictions can vary and
          should not be used as contraception or as a medical diagnosis.
        </p>
      </main>

      <AvgCycleDialog
        open={avgDialogOpen}
        onOpenChange={setAvgDialogOpen}
        currentValue={avgCycleSetting}
        onSave={saveAvgCycle}
      />

      <LogPeriodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={reload}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the period record and recalculates your averages and estimates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default CycleFit;
