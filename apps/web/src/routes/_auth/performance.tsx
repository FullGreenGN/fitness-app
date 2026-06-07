import { Card, CardContent, CardHeader, CardTitle } from "@fitness-app/ui/components/card";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Dumbbell, Loader2, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";

import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/performance")({
	component: PerformancePage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
	return new Date().toISOString().split("T")[0];
}

function fmtDate(iso: string) {
	return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

// ─── Shared chart tooltip style ────────────────────────────────────────────────

const TOOLTIP_STYLE = {
	contentStyle: {
		background: "hsl(0 0% 12%)",
		border: "1px solid hsl(0 0% 20%)",
		borderRadius: "10px",
		fontSize: "11px",
		color: "hsl(0 0% 95%)",
		padding: "6px 10px",
	},
	itemStyle: { color: "hsl(0 0% 95%)" },
	labelStyle: { opacity: 0.6, marginBottom: 2 },
};

// ─── Body Stats tab ────────────────────────────────────────────────────────────

function BodyStatsTab() {
	const { data: metrics, isPending } = useQuery(
		trpc.performance.getBodyMetrics.queryOptions(),
	);

	// Log form state
	const [form, setForm] = useState({
		weightKg: "",
		bodyFatPercentage: "",
		chestCm: "",
		armsCm: "",
		waistCm: "",
	});
	const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((f) => ({ ...f, [k]: e.target.value }));

	const { mutate, isPending: logging } = useMutation(
		trpc.performance.logMeasurement.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.performance.getBodyMetrics.queryFilter(),
				);
				toast.success("Measurements logged!");
				setForm({ weightKg: "", bodyFatPercentage: "", chestCm: "", armsCm: "", waistCm: "" });
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	function handleLog(e: React.FormEvent) {
		e.preventDefault();
		const payload: Parameters<typeof mutate>[0] = { date: todayISO() };
		if (form.weightKg) payload.weightKg = parseFloat(form.weightKg);
		if (form.bodyFatPercentage) payload.bodyFatPercentage = parseFloat(form.bodyFatPercentage);
		if (form.chestCm) payload.chestCm = parseFloat(form.chestCm);
		if (form.armsCm) payload.armsCm = parseFloat(form.armsCm);
		if (form.waistCm) payload.waistCm = parseFloat(form.waistCm);
		mutate(payload);
	}

	const weightData =
		metrics
			?.filter((m) => m.weightKg != null)
			.map((m) => ({ date: fmtDate(m.date), weight: m.weightKg })) ?? [];

	return (
		<div className="space-y-4">
			{/* Weight chart */}
			<Card className="rounded-2xl ring-1 ring-border">
				<CardHeader className="pb-0">
					<CardTitle className="flex items-center gap-2 text-sm font-semibold">
						<TrendingUp className="h-4 w-4 opacity-70" />
						Weight over Time
					</CardTitle>
				</CardHeader>
				<CardContent className="px-2 pt-3 pb-2">
					{isPending ? (
						<Skeleton className="h-[200px] w-full rounded-xl" />
					) : !weightData.length ? (
						<div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground/50">
							No weight data yet — log your first measurement below
						</div>
					) : (
						<ResponsiveContainer width="100%" height={200}>
							<LineChart
								data={weightData}
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
									interval="preserveStartEnd"
								/>
								<YAxis
									domain={["auto", "auto"]}
									tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(v: number) => `${v}kg`}
									width={36}
								/>
								<Tooltip
									{...TOOLTIP_STYLE}
									formatter={(v) => [`${v} kg`, "Weight"]}
								/>
								<Line
									type="monotone"
									dataKey="weight"
									stroke="#f97316"
									strokeWidth={2}
									dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
									activeDot={{ r: 5, fill: "#f97316", strokeWidth: 0 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					)}
				</CardContent>
			</Card>

			{/* Log form */}
			<Card className="rounded-2xl ring-1 ring-border">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">Log Today's Stats</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLog} className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
							{(
								[
									{ label: "Weight (kg)", key: "weightKg" },
									{ label: "Body Fat (%)", key: "bodyFatPercentage" },
									{ label: "Waist (cm)", key: "waistCm" },
									{ label: "Chest (cm)", key: "chestCm" },
									{ label: "Arms (cm)", key: "armsCm" },
								] as { label: string; key: keyof typeof form }[]
							).map(({ label, key }) => (
								<div key={key}>
									<label className="mb-1 block text-xs font-medium text-muted-foreground">
										{label}
									</label>
									<input
										type="number"
										min="0"
										step="0.1"
										placeholder="—"
										value={form[key]}
										onChange={set(key)}
										className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
									/>
								</div>
							))}
						</div>

						<button
							type="submit"
							disabled={logging || Object.values(form).every((v) => !v)}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
						>
							{logging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Measurements"}
						</button>
					</form>
				</CardContent>
			</Card>

			{/* Recent entries table */}
			{!!metrics?.length && (
				<Card className="rounded-2xl ring-1 ring-border">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-semibold">Recent Entries</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="divide-y divide-border/40">
							{[...metrics].reverse().slice(0, 10).map((m) => (
								<div
									key={m.id}
									className="flex items-center justify-between px-4 py-3 text-sm"
								>
									<span className="font-medium">{fmtDate(m.date)}</span>
									<div className="flex gap-4 tabular-nums text-muted-foreground">
										{m.weightKg != null && (
											<span className="text-orange-400">{m.weightKg} kg</span>
										)}
										{m.bodyFatPercentage != null && (
											<span>{m.bodyFatPercentage}% BF</span>
										)}
										{m.waistCm != null && <span>W {m.waistCm}</span>}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ─── Lifting Progress tab ──────────────────────────────────────────────────────

function LiftingTab() {
	const { data: exercises, isPending: exLoading } = useQuery(
		trpc.performance.getUserExercises.queryOptions(),
	);

	const [selectedDictId, setSelectedDictId] = useState("");

	const { data: progression, isPending: progLoading } = useQuery({
		...trpc.performance.getExerciseProgression.queryOptions({
			dictionaryId: selectedDictId,
		}),
		enabled: !!selectedDictId,
	});

	const chartData =
		progression?.map((r) => ({
			date: fmtDate(r.date),
			weight: r.maxWeight,
		})) ?? [];

	return (
		<div className="space-y-4">
			{/* Exercise selector */}
			<Card className="rounded-2xl ring-1 ring-border">
				<CardContent className="pt-4">
					<label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						Exercise
					</label>
					{exLoading ? (
						<Skeleton className="h-10 w-full rounded-xl" />
					) : (
						<select
							value={selectedDictId}
							onChange={(e) => setSelectedDictId(e.target.value)}
							className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
						>
							<option value="">— Select an exercise —</option>
							{exercises?.map((ex) => (
								<option key={ex.dictId} value={ex.dictId}>
									{ex.name}
								</option>
							))}
						</select>
					)}
				</CardContent>
			</Card>

			{/* Progression chart */}
			<Card className="rounded-2xl ring-1 ring-border">
				<CardHeader className="pb-0">
					<CardTitle className="flex items-center gap-2 text-sm font-semibold">
						<Dumbbell className="h-4 w-4 opacity-70" />
						Max Weight per Session
					</CardTitle>
				</CardHeader>
				<CardContent className="px-2 pt-3 pb-2">
					{!selectedDictId ? (
						<div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground/50">
							Select an exercise above to see progression
						</div>
					) : progLoading ? (
						<Skeleton className="h-[200px] w-full rounded-xl" />
					) : !chartData.length ? (
						<div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground/50">
							No sets logged for this exercise yet
						</div>
					) : (
						<ResponsiveContainer width="100%" height={200}>
							<LineChart
								data={chartData}
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
									interval="preserveStartEnd"
								/>
								<YAxis
									domain={["auto", "auto"]}
									tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(v: number) => `${v}kg`}
									width={36}
								/>
								<Tooltip
									{...TOOLTIP_STYLE}
									formatter={(v) => [`${v} kg`, "Max Weight"]}
								/>
								<Line
									type="monotone"
									dataKey="weight"
									stroke="#f97316"
									strokeWidth={2}
									dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
									activeDot={{ r: 5, fill: "#f97316", strokeWidth: 0 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "body" | "lifting";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
	{ key: "body", label: "Body Stats", icon: <Activity className="h-3.5 w-3.5" /> },
	{ key: "lifting", label: "Lifting", icon: <Dumbbell className="h-3.5 w-3.5" /> },
];

function PerformancePage() {
	const [tab, setTab] = useState<Tab>("body");

	return (
		<div className="min-h-full bg-background">
			{/* Sticky header */}
			<div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
				<div className="px-4 pt-4 pb-0">
					<h1 className="text-2xl font-bold tracking-tight">Performance</h1>
				</div>

				{/* Tab bar */}
				<div className="flex px-4 pt-3">
					{TABS.map(({ key, label, icon }) => (
						<button
							key={key}
							type="button"
							onClick={() => setTab(key)}
							className={`flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-sm font-semibold transition-colors ${
								tab === key
									? "border-b-2 border-orange-500 text-orange-400"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{icon}
							{label}
						</button>
					))}
				</div>
			</div>

			<div className="space-y-4 p-4 pb-24">
				{tab === "body" && <BodyStatsTab />}
				{tab === "lifting" && <LiftingTab />}
			</div>
		</div>
	);
}
