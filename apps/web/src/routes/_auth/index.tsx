import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fitness-app/ui/components/card";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Dumbbell, TrendingUp, Zap } from "lucide-react";
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

// 30 days of mock training volume (weight × reps, kg)
const VOLUME_DATA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const isRest = [2, 6, 9, 13, 16, 20, 23, 27].includes(i);
  const base = 5000 + i * 120;
  const jitter = Math.sin(i * 1.3) * 1200 + Math.cos(i * 0.7) * 800;
  return { date: label, volume: isRest ? 0 : Math.round(base + jitter) };
});

function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data: programs, isPending: programsLoading } = useQuery(
    trpc.programs.getAll.queryOptions(),
  );

  const firstName = session?.user.name?.split(" ")[0] ?? "Athlete";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // First workout of first program — used by the quick-start card
  const quickStartProgram = programs?.[0];
  const quickStartWorkout = quickStartProgram?.workouts?.[0];

  return (
    <div className="space-y-5 px-4 py-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{greeting}</p>
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
              {quickStartProgram ? quickStartProgram.name : "Quick Start"}
            </p>
            <p className="mt-1 text-xl font-bold">
              {quickStartWorkout ? quickStartWorkout.name : "Start a Workout"}
            </p>
            <p className="mt-1.5 text-xs opacity-60">
              {quickStartWorkout
                ? `${quickStartProgram?.workouts.length} workout${quickStartProgram?.workouts.length === 1 ? "" : "s"} in program`
                : "Go to Programs to get started"}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/15">
            <Zap className="h-7 w-7" strokeWidth={2.5} />
          </div>
        </div>
      </Link>

      {/* Volume chart */}
      <Card className="rounded-2xl ring-1 ring-border">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 opacity-70" />
            Volume — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-3 pb-2">
          <ResponsiveContainer width="100%" height={148}>
            <LineChart
              data={VOLUME_DATA}
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
                  `${Number(value).toLocaleString()} kg`,
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
        </CardContent>
      </Card>

      {/* Programs list */}
      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          My Programs
        </h2>
        <div className="space-y-2">
          {programsLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] w-full rounded-2xl" />
              ))
            : programs?.slice(0, 3).map((p) => (
                <Card
                  key={p.id}
                  className="rounded-2xl ring-1 ring-border transition-transform active:scale-[0.99]"
                >
                  <CardContent className="flex items-center gap-3 py-3.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.workouts.length} workout{p.workouts.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
          {!programsLoading && programs?.length === 0 && (
            <p className="px-1 text-xs text-muted-foreground/60">
              No programs yet — create one in the Programs tab.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
