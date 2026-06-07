import { Card, CardContent, CardHeader, CardTitle } from "@fitness-app/ui/components/card";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Apple, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/nutrition/")({
	component: NutritionPage,
});

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

function todayISO() {
	return new Date().toISOString().split("T")[0];
}

function shiftDate(iso: string, days: number) {
	const d = new Date(`${iso}T12:00:00`);
	d.setDate(d.getDate() + days);
	return d.toISOString().split("T")[0];
}

function formatDateLabel(iso: string) {
	const today = todayISO();
	const yesterday = shiftDate(today, -1);
	if (iso === today) return "Today";
	if (iso === yesterday) return "Yesterday";
	return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

type FoodItem = {
	name: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	servingSize: string;
};

type Ingredient = { quantity: number; food: FoodItem };

type Entry = {
	id: string;
	quantity: number;
	mealType: string;
	food: FoodItem | null;
	meal: ({ name: string; ingredients: Ingredient[] }) | null;
};

type Macros = { calories: number; protein: number; carbs: number; fat: number };

function entryMacros(entry: Entry): Macros {
	if (entry.food) {
		const q = entry.quantity;
		return {
			calories: entry.food.calories * q,
			protein: entry.food.protein * q,
			carbs: entry.food.carbs * q,
			fat: entry.food.fat * q,
		};
	}
	if (entry.meal) {
		const perServing = entry.meal.ingredients.reduce(
			(acc, ing) => ({
				calories: acc.calories + ing.food.calories * ing.quantity,
				protein: acc.protein + ing.food.protein * ing.quantity,
				carbs: acc.carbs + ing.food.carbs * ing.quantity,
				fat: acc.fat + ing.food.fat * ing.quantity,
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0 },
		);
		const q = entry.quantity;
		return {
			calories: perServing.calories * q,
			protein: perServing.protein * q,
			carbs: perServing.carbs * q,
			fat: perServing.fat * q,
		};
	}
	return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function sumMacros(entries: Entry[]): Macros {
	return entries.reduce(
		(acc, e) => {
			const m = entryMacros(e);
			return {
				calories: acc.calories + m.calories,
				protein: acc.protein + m.protein,
				carbs: acc.carbs + m.carbs,
				fat: acc.fat + m.fat,
			};
		},
		{ calories: 0, protein: 0, carbs: 0, fat: 0 },
	);
}

function NutritionPage() {
	const [selectedDate, setSelectedDate] = useState(todayISO);
	const isToday = selectedDate === todayISO();

	const { data: log, isPending } = useQuery(
		trpc.nutrition.getDailyLog.queryOptions({ date: selectedDate }),
	);

	const entries = (log?.entries ?? []) as Entry[];
	const totals = sumMacros(entries);

	function entriesForMeal(type: MealType) {
		return entries.filter((e) => e.mealType === type);
	}

	return (
		<div className="min-h-full bg-background">
			{/* Sticky header with date navigation */}
			<div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
				<div className="flex items-center justify-between px-4 py-3">
					<button
						type="button"
						onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
						className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>

					<div className="text-center">
						<p className="text-sm font-bold">{formatDateLabel(selectedDate)}</p>
						{!isToday && (
							<p className="text-[11px] text-muted-foreground">{selectedDate}</p>
						)}
					</div>

					<button
						type="button"
						onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
						disabled={isToday}
						className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			</div>

			<div className="space-y-4 p-4 pb-24">
				{/* Macro summary card */}
				<Card className="rounded-2xl ring-1 ring-border">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-semibold">
							<Apple className="h-4 w-4 opacity-70" />
							Daily Summary
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isPending ? (
							<Skeleton className="h-16 w-full rounded-xl" />
						) : (
							<div className="grid grid-cols-4 gap-2">
								{(
									[
										{ label: "Calories", value: Math.round(totals.calories), unit: "kcal" },
										{ label: "Protein", value: Math.round(totals.protein), unit: "g" },
										{ label: "Carbs", value: Math.round(totals.carbs), unit: "g" },
										{ label: "Fat", value: Math.round(totals.fat), unit: "g" },
									] as const
								).map(({ label, value, unit }) => (
									<div
										key={label}
										className="flex flex-col items-center rounded-xl bg-muted/50 py-3"
									>
										<span className="text-lg font-bold tabular-nums text-orange-400">
											{value}
										</span>
										<span className="text-[10px] text-muted-foreground">{unit}</span>
										<span className="text-[10px] font-medium text-muted-foreground/70">
											{label}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* One card per meal type */}
				{MEAL_TYPES.map((mealType) => {
					const mealEntries = entriesForMeal(mealType);
					const mealTotals = sumMacros(mealEntries);

					return (
						<Card key={mealType} className="overflow-hidden rounded-2xl ring-1 ring-border">
							<CardContent className="p-0">
								{/* Meal header */}
								<div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
									<div>
										<p className="text-sm font-bold">{mealType}</p>
										{mealEntries.length > 0 && (
											<p className="text-[11px] tabular-nums text-orange-400">
												{Math.round(mealTotals.calories)} kcal
											</p>
										)}
									</div>
									<button
										type="button"
										className="flex h-7 items-center gap-1 rounded-full border border-border px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground active:scale-95"
									>
										<Plus className="h-3 w-3" />
										Add Food
									</button>
								</div>

								{/* Entries */}
								{mealEntries.length === 0 ? (
									<div className="px-4 py-5 text-center">
										<p className="text-xs text-muted-foreground/40">No food logged yet</p>
									</div>
								) : (
									<div className="divide-y divide-border/30">
										{mealEntries.map((entry) => {
											const macros = entryMacros(entry);
											const name =
												entry.food?.name ?? entry.meal?.name ?? "Unknown";
											const serving = entry.food?.servingSize
												? `${entry.quantity} × ${entry.food.servingSize}`
												: `${entry.quantity} serving${entry.quantity === 1 ? "" : "s"}`;
											return (
												<div
													key={entry.id}
													className="flex items-center justify-between px-4 py-3"
												>
													<div className="min-w-0 flex-1">
														<p className="truncate text-sm font-medium">{name}</p>
														<p className="text-[11px] text-muted-foreground">{serving}</p>
													</div>
													<div className="ml-3 shrink-0 text-right">
														<p className="text-sm font-semibold tabular-nums text-orange-400">
															{Math.round(macros.calories)} kcal
														</p>
														<p className="text-[11px] tabular-nums text-muted-foreground">
															P {Math.round(macros.protein)}g · C{" "}
															{Math.round(macros.carbs)}g · F {Math.round(macros.fat)}g
														</p>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
