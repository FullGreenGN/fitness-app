import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fitness-app/ui/components/card";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Dumbbell, Flame, Play, TrendingUp, Zap } from "lucide-react";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/")({ component: DashboardPage });

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TFunc = (key: string) => string;

function formatSessionDate(isoDate: string, t: TFunc, lang: string): string {
  const today = new Date();
  const d = new Date(`${isoDate}T12:00:00`);
  const diffDays = Math.round(
    (today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (diffDays === 0) return t("dashboard.today");
  if (diffDays === 1) return t("dashboard.yesterday");
  if (diffDays < 7)
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(lang, { weekday: "long" });
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(lang, {
    month: "short",
    day: "numeric",
  });
}

// Build the last-30-days spine, merging in real volumes where they exist
function buildVolumeData(rows: { date: string; volume: number }[] | undefined) {
  const map: Record<string, number> = {};
  for (const r of rows ?? []) map[r.date] = r.volume;

  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date: label, volume: map[iso] ?? 0 };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language;

  const { data: session } = authClient.useSession();
  const { data: programs, isPending: programsLoading } = useQuery(
    trpc.programs.getAll.queryOptions(),
  );
  const { data: volumeRows, isPending: volumeLoading } = useQuery(
    trpc.stats.volumeByDay.queryOptions(),
  );
  const { data: history, isPending: historyLoading } = useQuery(
    trpc.stats.workoutHistory.queryOptions(),
  );
  const { data: currentWorkoutRaw } = useQuery(
    trpc.liveWorkout.currentWorkout.queryOptions(),
  );

  const finishedRef = useRef<Set<string> | null>(null);
  if (!finishedRef.current) {
    try {
      finishedRef.current = new Set(
        JSON.parse(localStorage.getItem("finishedWorkouts") ?? "[]"),
      );
    } catch {
      finishedRef.current = new Set();
    }
  }
  const currentWorkout =
    currentWorkoutRaw && !finishedRef.current.has(currentWorkoutRaw.workoutId)
      ? currentWorkoutRaw
      : null;

  const volumeData = useMemo(() => buildVolumeData(volumeRows), [volumeRows]);
  const hasVolume = volumeData.some((d) => d.volume > 0);

  const firstName = session?.user.name?.split(" ")[0] ?? "Athlete";
  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? "dashboard.greeting.morning"
    : hour < 17 ? "dashboard.greeting.afternoon"
    : "dashboard.greeting.evening";

  const quickStartProgram = programs?.[0];
  const quickStartWorkout = quickStartProgram?.workouts?.[0];

  return (
    <div className="space-y-5 px-4 py-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{t(greetingKey)}</p>
        <h1 className="text-3xl font-bold tracking-tight">{firstName}</h1>
      </div>

      {/* Quick Start card */}
      <Link
        to="/workout"
        search={quickStartWorkout ? { workoutId: quickStartWorkout.id } : {}}
      >
        <div className="flex items-center justify-between rounded-2xl bg-foreground p-5 text-background shadow-lg transition-transform active:scale-[0.98]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-60">
              {quickStartProgram ? quickStartProgram.name : t("dashboard.quickStart")}
            </p>
            <p className="mt-1 text-xl font-bold">
              {quickStartWorkout ? quickStartWorkout.name : t("dashboard.startWorkout")}
            </p>
            <p className="mt-1.5 text-xs opacity-60">
              {quickStartWorkout
                ? t(
                    quickStartProgram!.workouts.length === 1
                      ? "dashboard.workoutsInProgram_one"
                      : "dashboard.workoutsInProgram_other",
                    { count: quickStartProgram!.workouts.length },
                  )
                : t("dashboard.goToPrograms")}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/15">
            <Zap className="h-7 w-7" strokeWidth={2.5} />
          </div>
        </div>
      </Link>

      {/* Continue Workout card */}
      {currentWorkout && (
        <Link to="/workout" search={{ workoutId: currentWorkout.workoutId }}>
          <div className="flex items-center justify-between rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 transition-transform active:scale-[0.98]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-400">
                {t("dashboard.continue")}
              </p>
              <p className="mt-1 text-base font-bold">{currentWorkout.workoutName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{currentWorkout.programName}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
              <Play className="h-5 w-5 fill-orange-400 text-orange-400" strokeWidth={0} />
            </div>
          </div>
        </Link>
      )}

      {/* Volume chart */}
      <Card className="rounded-2xl ring-1 ring-border">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 opacity-70" />
            {t("dashboard.volume")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-3 pb-2">
          {volumeLoading ? (
            <Skeleton className="h-[148px] w-full rounded-xl" />
          ) : !hasVolume ? (
            <div className="flex h-[148px] items-center justify-center text-xs text-muted-foreground/50">
              {t("dashboard.noWorkouts")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={148}>
              <LineChart
                data={volumeData}
                margin={{ top: 4, right: 12, bottom: 0, left: -8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 12%)",
                    border: "1px solid hsl(0 0% 20%)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "hsl(0 0% 95%)",
                    padding: "6px 10px",
                  }}
                  itemStyle={{ color: "hsl(0 0% 95%)" }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString(lang)} kg`,
                    "Volume",
                  ]}
                  labelStyle={{ opacity: 0.6, marginBottom: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Programs list */}
      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.programs")}
        </h2>
        <div className="space-y-2">
          {programsLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] w-full rounded-2xl" />
              ))
            : programs?.slice(0, 3).map((p) => (
                <Link key={p.id} to="/programs/$programId" params={{ programId: p.id }}>
                  <Card className="rounded-2xl ring-1 ring-border transition-transform active:scale-[0.99]">
                    <CardContent className="flex items-center gap-3 py-3.5">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t(
                            p.workouts.length === 1
                              ? "dashboard.workoutsInProgram_one"
                              : "dashboard.workoutsInProgram_other",
                            { count: p.workouts.length },
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
          {!programsLoading && programs?.length === 0 && (
            <p className="px-1 text-xs text-muted-foreground/60">
              {t("dashboard.noPrograms")}
            </p>
          )}
        </div>
      </div>

      {/* Workout history */}
      <div className="space-y-2 pb-6">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.history")}
        </h2>

        {historyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
            ))}
          </div>
        ) : !history?.length ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <Flame className="mx-auto h-7 w-7 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.noWorkouts")}</p>
            <p className="text-xs text-muted-foreground/50">{t("dashboard.noHistoryHint")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((session) => (
              <Link
                key={`${session.workoutId}-${session.date}`}
                to="/workout"
                search={{ workoutId: session.workoutId }}
              >
                <Card className="rounded-2xl ring-1 ring-border transition-transform active:scale-[0.99]">
                  <CardContent className="flex items-center gap-3 py-3.5">
                    {/* Date badge */}
                    <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-muted py-1.5">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        {new Date(`${session.date}T12:00:00`).toLocaleDateString(lang, {
                          month: "short",
                        })}
                      </span>
                      <span className="text-lg font-bold leading-tight tabular-nums">
                        {new Date(`${session.date}T12:00:00`).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{session.workoutName}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {session.programName}
                        <span className="mx-1.5 opacity-30">·</span>
                        {formatSessionDate(session.date, t, lang)}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] tabular-nums text-muted-foreground/70">
                          {session.setCount} set{session.setCount === 1 ? "" : "s"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/30">·</span>
                        <span className="text-[10px] tabular-nums text-muted-foreground/70">
                          {session.exerciseCount} exercise{session.exerciseCount === 1 ? "" : "s"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/30">·</span>
                        <span className="text-[10px] tabular-nums text-orange-400">
                          {session.volume.toLocaleString(lang)} kg
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
