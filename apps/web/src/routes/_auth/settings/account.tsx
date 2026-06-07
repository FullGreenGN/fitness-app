import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Globe, Loader2, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/settings/account")({
	component: AccountPage,
});

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	heightCm: z
		.number({ error: "Enter your height" })
		.positive("Must be positive")
		.max(300, "Too tall"),
	weightKg: z
		.number({ error: "Enter your weight" })
		.positive("Must be positive")
		.max(500, "Too heavy"),
	age: z
		.number({ error: "Enter your age" })
		.int()
		.min(10, "Must be at least 10")
		.max(120, "Must be at most 120"),
	gender: z.enum(["male", "female"]),
	goal: z.enum(["bulk", "cut", "maintain"]),
	dietPreference: z.enum(["standard", "vegan", "keto"]),
});

type FormValues = z.infer<typeof schema>;

// ─── Macro preview (Mifflin-St Jeor, client-side) ────────────────────────────

function calcMacroPreview(v: Partial<FormValues>) {
	const { weightKg, heightCm, age, gender, goal } = v;
	if (
		!weightKg || !heightCm || !age || !gender || !goal ||
		isNaN(weightKg) || isNaN(heightCm) || isNaN(age)
	) return null;

	const s = gender === "male" ? 5 : -161;
	const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
	const tdee = bmr * 1.55;
	const adjust = goal === "bulk" ? 400 : goal === "cut" ? -500 : 0;
	const calories = Math.round(tdee + adjust);
	const protein = Math.round(weightKg * 2);
	const fat = Math.round((calories * 0.25) / 9);
	const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
	return { calories, protein, fat, carbs };
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
	if (!message) return null;
	return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			{children}
		</label>
	);
}

const INPUT_CLS =
	"w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50";

const SELECT_CLS =
	"w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50 appearance-none";

// ─── Page ─────────────────────────────────────────────────────────────────────

function AccountPage() {
	const { t, i18n } = useTranslation("common");

	const { data: profile, isPending: profileLoading } = useQuery(
		trpc.user.getProfile.queryOptions(),
	);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
	});

	useEffect(() => {
		if (!profile) return;
		reset({
			heightCm: profile.settings?.heightCm ?? undefined,
			weightKg: profile.latestWeight ?? undefined,
			age: profile.settings?.age ?? undefined,
			gender: (profile.settings?.gender as "male" | "female") ?? "male",
			goal: (profile.settings?.goal as "bulk" | "cut" | "maintain") ?? "maintain",
			dietPreference:
				(profile.settings?.dietPreference as "standard" | "vegan" | "keto") ?? "standard",
		});
	}, [profile, reset]);

	const watched = watch();
	const macroPreview = calcMacroPreview(watched);

	const { mutate, isPending: saving } = useMutation(
		trpc.user.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.user.getProfile.queryFilter());
				queryClient.invalidateQueries(trpc.user.getSettings.queryFilter());
				queryClient.invalidateQueries(trpc.performance.getBodyMetrics.queryFilter());
				toast.success(t("account.saveSuccess"));
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	return (
		<div className="min-h-full bg-background">
			{/* Sticky header */}
			<div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
				<div className="flex items-center gap-3 px-4 py-3">
					<Link
						to="/settings"
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
					>
						<ChevronLeft className="h-4 w-4" />
					</Link>
					<div>
						<h1 className="text-base font-bold leading-tight">{t("account.title")}</h1>
						<p className="text-xs text-muted-foreground">{t("account.subtitle")}</p>
					</div>
				</div>
			</div>

			{/* Profile form */}
			{profileLoading ? (
				<FormSkeleton />
			) : (
				<form
					onSubmit={handleSubmit((values) => mutate(values))}
					className="space-y-6 p-4 pb-2"
				>
					{/* ── Physical Details ─────────────────────────── */}
					<Section title={t("account.physicalDetails")}>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<FieldLabel>{t("account.age")}</FieldLabel>
								<input
									type="number"
									placeholder="25"
									className={INPUT_CLS}
									{...register("age", { valueAsNumber: true })}
								/>
								<FieldError message={errors.age?.message} />
							</div>
							<div>
								<FieldLabel>{t("account.gender")}</FieldLabel>
								<select className={SELECT_CLS} {...register("gender")}>
									<option value="male">{t("account.male")}</option>
									<option value="female">{t("account.female")}</option>
								</select>
								<FieldError message={errors.gender?.message} />
							</div>
						</div>

						<div>
							<FieldLabel>{t("account.height")}</FieldLabel>
							<input
								type="number"
								placeholder="175"
								className={INPUT_CLS}
								{...register("heightCm", { valueAsNumber: true })}
							/>
							<FieldError message={errors.heightCm?.message} />
						</div>

						<div>
							<FieldLabel>{t("account.weight")}</FieldLabel>
							<input
								type="number"
								step="0.1"
								placeholder="75.0"
								className={INPUT_CLS}
								{...register("weightKg", { valueAsNumber: true })}
							/>
							<p className="mt-1 text-[11px] text-muted-foreground/60">
								{t("account.weightHint")}
							</p>
							<FieldError message={errors.weightKg?.message} />
						</div>
					</Section>

					{/* ── Goals ────────────────────────────────────── */}
					<Section title={t("account.goals")}>
						<div>
							<FieldLabel>{t("account.goal")}</FieldLabel>
							<select className={SELECT_CLS} {...register("goal")}>
								<option value="bulk">{t("account.goalBulk")}</option>
								<option value="cut">{t("account.goalCut")}</option>
								<option value="maintain">{t("account.goalMaintain")}</option>
							</select>
							<FieldError message={errors.goal?.message} />
						</div>

						<div>
							<FieldLabel>{t("account.diet")}</FieldLabel>
							<select className={SELECT_CLS} {...register("dietPreference")}>
								<option value="standard">{t("account.dietStandard")}</option>
								<option value="vegan">{t("account.dietVegan")}</option>
								<option value="keto">{t("account.dietKeto")}</option>
							</select>
							<FieldError message={errors.dietPreference?.message} />
						</div>
					</Section>

					{/* ── Macro Preview ─────────────────────────────── */}
					{macroPreview ? (
						<div className="space-y-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
							<div className="flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-orange-400" />
								<p className="text-sm font-semibold text-orange-400">
									{t("account.macroPreview")}
								</p>
							</div>
							<div className="grid grid-cols-4 gap-2">
								{[
									{ label: t("nutrition.calories"), value: macroPreview.calories, unit: "kcal" },
									{ label: t("nutrition.protein"), value: macroPreview.protein, unit: "g" },
									{ label: t("nutrition.carbs"), value: macroPreview.carbs, unit: "g" },
									{ label: t("nutrition.fat"), value: macroPreview.fat, unit: "g" },
								].map(({ label, value, unit }) => (
									<div
										key={label}
										className="flex flex-col items-center rounded-xl bg-orange-500/10 py-3"
									>
										<span className="text-lg font-bold tabular-nums text-orange-400">
											{value}
										</span>
										<span className="text-[10px] text-orange-300/70">{unit}</span>
										<span className="text-[10px] font-medium text-orange-300/50">
											{label}
										</span>
									</div>
								))}
							</div>
							<p className="text-center text-[10px] text-muted-foreground/50">
								{t("account.macroHint")}
							</p>
						</div>
					) : (
						<div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
							<Sparkles className="mx-auto h-6 w-6 text-muted-foreground/30" />
							<p className="mt-2 text-xs text-muted-foreground/60">
								{t("account.macroPlaceholder")}
							</p>
						</div>
					)}

					{/* ── Submit ────────────────────────────────────── */}
					<button
						type="submit"
						disabled={saving}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98] disabled:opacity-50"
					>
						{saving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								{t("account.saving")}
							</>
						) : (
							t("account.save")
						)}
					</button>
				</form>
			)}

			{/* ── App Preferences — lives outside the profile form ─────────────────
			    Language choice is managed entirely by i18next / localStorage and
			    is NOT sent to the backend, so it must not sit inside <form>. */}
			<div className="space-y-6 p-4 pb-24">
				<Section title={t("account.appPreferences")}>
					<div>
						<FieldLabel>
							<span className="flex items-center gap-1.5">
								<Globe className="h-3 w-3" />
								{t("account.language")}
							</span>
						</FieldLabel>
						<select
							className={SELECT_CLS}
							value={i18n.language}
							onChange={(e) => void i18n.changeLanguage(e.target.value)}
						>
							<option value="en">{t("languages.en")}</option>
							<option value="fr">{t("languages.fr")}</option>
						</select>
						<p className="mt-1.5 text-[11px] text-muted-foreground/50">
							{i18n.language === "fr"
								? "La langue est enregistrée localement sur cet appareil."
								: "Language is saved locally on this device."}
						</p>
					</div>
				</Section>
			</div>
		</div>
	);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="space-y-4">
			<h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
				{title}
			</h2>
			<div className="space-y-4 rounded-2xl border border-border bg-card p-4">
				{children}
			</div>
		</div>
	);
}

function FormSkeleton() {
	return (
		<div className="space-y-6 p-4">
			{[130, 100, 80].map((h) => (
				<div key={h} className="space-y-3 rounded-2xl border border-border bg-card p-4">
					<Skeleton className="h-3 w-28 rounded-lg" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="rounded-xl" style={{ height: h / 3 + 28 }} />
						<Skeleton className="rounded-xl" style={{ height: h / 3 + 28 }} />
					</div>
					{h > 100 && <Skeleton className="h-[42px] w-full rounded-xl" />}
				</div>
			))}
			<Skeleton className="h-[52px] w-full rounded-xl" />
		</div>
	);
}
