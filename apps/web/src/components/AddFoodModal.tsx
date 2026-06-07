import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ScanBarcode, UtensilsCrossed, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { queryClient, trpc } from "@/utils/trpc";
import { BarcodeScanner, type BarcodeProductResult } from "./BarcodeScanner";

// ─── Types ────────────────────────────────────────────────────────────────────

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
type Tab = "scan" | "manual" | "presets";

interface AddFoodModalProps {
	open: boolean;
	date: string;
	mealType: MealType;
	onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MacroBadge({ label, value, unit }: { label: string; value: number; unit: string }) {
	return (
		<div className="flex flex-col items-center rounded-xl bg-muted/60 py-2">
			<span className="text-base font-bold tabular-nums text-orange-400">
				{Math.round(value)}
			</span>
			<span className="text-[10px] text-muted-foreground">{unit}</span>
			<span className="text-[10px] text-muted-foreground/60">{label}</span>
		</div>
	);
}

// ─── Scan tab ─────────────────────────────────────────────────────────────────

function ScanTab({
	date,
	mealType,
	onSuccess,
}: {
	date: string;
	mealType: MealType;
	onSuccess: () => void;
}) {
	const [scanned, setScanned] = useState<BarcodeProductResult | null>(null);
	const [qty, setQty] = useState("1");

	const { mutate, isPending } = useMutation(
		trpc.nutrition.logQuickFood.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.nutrition.getDailyLog.queryFilter({ date }),
				);
				toast.success("Added to log!");
				onSuccess();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	if (scanned) {
		const multiplier = parseFloat(qty) || 1;
		return (
			<div className="space-y-4">
				{/* Product card */}
				<div className="overflow-hidden rounded-2xl border border-border">
					{scanned.imageUrl && (
						<img
							src={scanned.imageUrl}
							alt={scanned.name}
							className="h-40 w-full object-cover"
						/>
					)}
					<div className="p-4">
						<p className="font-bold">{scanned.name}</p>
						{scanned.brand && (
							<p className="text-sm text-muted-foreground">{scanned.brand}</p>
						)}
						<p className="mt-0.5 text-xs text-muted-foreground">
							Per serving: {scanned.servingSize}
						</p>
					</div>
				</div>

				{/* Macros preview */}
				<div className="grid grid-cols-4 gap-2">
					<MacroBadge label="Calories" value={scanned.calories * multiplier} unit="kcal" />
					<MacroBadge label="Protein" value={scanned.protein * multiplier} unit="g" />
					<MacroBadge label="Carbs" value={scanned.carbs * multiplier} unit="g" />
					<MacroBadge label="Fat" value={scanned.fat * multiplier} unit="g" />
				</div>

				{/* Quantity + add */}
				<div className="flex gap-3">
					<div className="flex-1">
						<label className="mb-1 block text-xs font-medium text-muted-foreground">
							Servings
						</label>
						<input
							type="number"
							min="0.1"
							step="0.1"
							value={qty}
							onChange={(e) => setQty(e.target.value)}
							className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
						/>
					</div>
					<button
						type="button"
						onClick={() =>
							mutate({
								date,
								mealType,
								quantity: parseFloat(qty) || 1,
								name: scanned.name,
								brand: scanned.brand ?? undefined,
								servingSize: scanned.servingSize,
								calories: scanned.calories,
								protein: scanned.protein,
								carbs: scanned.carbs,
								fat: scanned.fat,
							})
						}
						disabled={isPending}
						className="self-end rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
					>
						{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Log"}
					</button>
				</div>

				<button
					type="button"
					onClick={() => { setScanned(null); setQty("1"); }}
					className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground"
				>
					Scan Another
				</button>
			</div>
		);
	}

	return (
		<BarcodeScanner
			onProductFound={(product) => { setScanned(product); setQty("1"); }}
			onCancel={onSuccess}
		/>
	);
}

// ─── Manual entry tab ─────────────────────────────────────────────────────────

function ManualTab({
	date,
	mealType,
	onSuccess,
}: {
	date: string;
	mealType: MealType;
	onSuccess: () => void;
}) {
	const [form, setForm] = useState({
		name: "",
		brand: "",
		servingSize: "100g",
		calories: "",
		protein: "",
		carbs: "",
		fat: "",
		quantity: "1",
	});

	const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((f) => ({ ...f, [k]: e.target.value }));

	const { mutate, isPending } = useMutation(
		trpc.nutrition.logQuickFood.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.nutrition.getDailyLog.queryFilter({ date }),
				);
				toast.success("Added to log!");
				onSuccess();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim()) { toast.error("Name is required"); return; }
		mutate({
			date,
			mealType,
			quantity: parseFloat(form.quantity) || 1,
			name: form.name.trim(),
			brand: form.brand.trim() || undefined,
			servingSize: form.servingSize.trim() || "100g",
			calories: parseFloat(form.calories) || 0,
			protein: parseFloat(form.protein) || 0,
			carbs: parseFloat(form.carbs) || 0,
			fat: parseFloat(form.fat) || 0,
		});
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			{[
				{ label: "Food Name *", key: "name" as const, placeholder: "e.g. Brown rice", type: "text" },
				{ label: "Brand", key: "brand" as const, placeholder: "Optional", type: "text" },
				{ label: "Serving Size", key: "servingSize" as const, placeholder: "e.g. 100g", type: "text" },
				{ label: "Servings", key: "quantity" as const, placeholder: "1", type: "number" },
			].map(({ label, key, placeholder, type }) => (
				<div key={key}>
					<label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
					<input
						type={type}
						placeholder={placeholder}
						value={form[key]}
						onChange={set(key)}
						min={type === "number" ? "0.1" : undefined}
						step={type === "number" ? "0.1" : undefined}
						className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
					/>
				</div>
			))}

			<p className="pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				Macros (per serving)
			</p>

			<div className="grid grid-cols-2 gap-3">
				{[
					{ label: "Calories (kcal)", key: "calories" as const },
					{ label: "Protein (g)", key: "protein" as const },
					{ label: "Carbs (g)", key: "carbs" as const },
					{ label: "Fat (g)", key: "fat" as const },
				].map(({ label, key }) => (
					<div key={key}>
						<label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
						<input
							type="number"
							min="0"
							step="0.1"
							placeholder="0"
							value={form[key]}
							onChange={set(key)}
							className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
						/>
					</div>
				))}
			</div>

			<button
				type="submit"
				disabled={isPending}
				className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
			>
				{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Log"}
			</button>
		</form>
	);
}

// ─── Presets tab ──────────────────────────────────────────────────────────────

function PresetsTab({
	date,
	mealType,
	onSuccess,
}: {
	date: string;
	mealType: MealType;
	onSuccess: () => void;
}) {
	const { data: presets, isPending } = useQuery(
		trpc.nutrition.getPresetMeals.queryOptions(),
	);

	const { mutate } = useMutation(
		trpc.nutrition.logQuickFood.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.nutrition.getDailyLog.queryFilter({ date }),
				);
				toast.success("Added to log!");
				onSuccess();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	if (isPending) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-20 w-full rounded-2xl" />
				))}
			</div>
		);
	}

	if (!presets?.length) {
		return (
			<div className="flex flex-col items-center gap-2 py-12 text-center">
				<p className="text-sm text-muted-foreground">No presets for your current goal.</p>
				<p className="text-xs text-muted-foreground/60">
					Set your goal in the Performance tab to unlock presets.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{presets.map((preset) => (
				<div
					key={preset.name}
					className="flex items-center justify-between rounded-2xl border border-border p-4"
				>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold">{preset.name}</p>
						<p className="text-xs text-muted-foreground">{preset.servingSize}</p>
						<p className="mt-1 text-xs tabular-nums text-orange-400">
							{preset.calories} kcal · P {preset.protein}g · C {preset.carbs}g · F {preset.fat}g
						</p>
					</div>
					<button
						type="button"
						onClick={() =>
							mutate({
								date,
								mealType,
								quantity: 1,
								name: preset.name,
								brand: preset.brand,
								servingSize: preset.servingSize,
								calories: preset.calories,
								protein: preset.protein,
								carbs: preset.carbs,
								fat: preset.fat,
							})
						}
						className="ml-3 shrink-0 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 transition-transform active:scale-95"
					>
						+ Add
					</button>
				</div>
			))}
		</div>
	);
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
	{ key: "scan", label: "Scan", icon: <ScanBarcode className="h-3.5 w-3.5" /> },
	{ key: "manual", label: "Manual", icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
	{ key: "presets", label: "Presets", icon: <Zap className="h-3.5 w-3.5" /> },
];

export function AddFoodModal({ open, date, mealType, onClose }: AddFoodModalProps) {
	const [tab, setTab] = useState<Tab>("scan");

	if (!open) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Sheet */}
			<div className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[92svh] flex-col rounded-t-3xl bg-card">
				{/* Drag pill */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
				</div>

				{/* Header */}
				<div className="flex items-center justify-between px-5 pb-3">
					<div>
						<p className="font-bold">Add Food</p>
						<p className="text-xs text-muted-foreground">{mealType}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Tab bar */}
				<div className="flex border-b border-border px-5">
					{TABS.map(({ key, label, icon }) => (
						<button
							key={key}
							type="button"
							onClick={() => setTab(key)}
							className={`flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-semibold transition-colors ${
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

				{/* Tab content — scrollable */}
				<div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
					{tab === "scan" && (
						<ScanTab date={date} mealType={mealType} onSuccess={onClose} />
					)}
					{tab === "manual" && (
						<ManualTab date={date} mealType={mealType} onSuccess={onClose} />
					)}
					{tab === "presets" && (
						<PresetsTab date={date} mealType={mealType} onSuccess={onClose} />
					)}
				</div>
			</div>
		</>
	);
}
