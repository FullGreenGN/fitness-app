import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { bodyMeasurements } from "@fitness-app/db/schema/body_measurements";
import { userSettings } from "@fitness-app/db/schema/user_settings";

import { protectedProcedure, router } from "../index";

// ─── Mifflin-St Jeor macro calculator ────────────────────────────────────────

function calcMacros(
	weightKg: number,
	heightCm: number,
	age: number,
	gender: "male" | "female",
	goal: "bulk" | "cut" | "maintain",
) {
	const s = gender === "male" ? 5 : -161;
	const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
	const tdee = bmr * 1.55; // moderate activity multiplier
	const adjust = goal === "bulk" ? 400 : goal === "cut" ? -500 : 0;
	const calories = Math.round(tdee + adjust);
	const protein = Math.round(weightKg * 2); // 2 g/kg body weight
	const fat = Math.round((calories * 0.25) / 9); // 25% of cals from fat
	const carbs = Math.round((calories - protein * 4 - fat * 9) / 4); // remainder
	return { calories, protein, carbs, fat };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const userRouter = router({
	// Fetches settings + latest weight in a single call — used by the account form
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const [settings, latestMeasurement] = await Promise.all([
			db.query.userSettings.findFirst({
				where: eq(userSettings.userId, ctx.user.id),
			}),
			db.query.bodyMeasurements.findFirst({
				where: eq(bodyMeasurements.userId, ctx.user.id),
				orderBy: (m, { desc }) => [desc(m.date)],
				columns: { weightKg: true, date: true },
			}),
		]);
		return {
			settings: settings ?? null,
			latestWeight: latestMeasurement?.weightKg ?? null,
		};
	}),

	// Full profile save: upserts settings + logs a new weight measurement + recalculates macros
	updateProfile: protectedProcedure
		.input(
			z.object({
				heightCm: z.number().positive(),
				weightKg: z.number().positive(),
				age: z.number().int().min(10).max(120),
				gender: z.enum(["male", "female"]),
				goal: z.enum(["bulk", "cut", "maintain"]),
				dietPreference: z.enum(["standard", "vegan", "keto"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { weightKg, ...rest } = input;
			const macros = calcMacros(weightKg, rest.heightCm, rest.age, rest.gender, rest.goal);
			const today = new Date().toISOString().split("T")[0];

			const existing = await db.query.userSettings.findFirst({
				where: eq(userSettings.userId, ctx.user.id),
				columns: { id: true },
			});

			const settingsValues = {
				userId: ctx.user.id,
				...rest,
				targetCalories: macros.calories,
				targetProtein: macros.protein,
				targetCarbs: macros.carbs,
				targetFat: macros.fat,
			};

			const [settings, measurement] = await Promise.all([
				existing
					? db
						.update(userSettings)
						.set(settingsValues)
						.where(eq(userSettings.userId, ctx.user.id))
						.returning()
						.then((r) => r[0])
					: db.insert(userSettings).values(settingsValues).returning().then((r) => r[0]),
				db
					.insert(bodyMeasurements)
					.values({ userId: ctx.user.id, date: today, weightKg })
					.returning()
					.then((r) => r[0]),
			]);

			return { settings, measurement };
		}),

	// Used by the nutrition diary to read macro targets
	getSettings: protectedProcedure.query(async ({ ctx }) => {
		const settings = await db.query.userSettings.findFirst({
			where: eq(userSettings.userId, ctx.user.id),
		});
		return settings ?? null;
	}),

	updateSettings: protectedProcedure
		.input(
			z.object({
				heightCm: z.number().positive().optional(),
				age: z.number().int().min(10).max(120).optional(),
				gender: z.enum(["male", "female"]).optional(),
				goal: z.enum(["bulk", "cut", "maintain"]).optional(),
				dietPreference: z.enum(["standard", "vegan", "keto"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.userSettings.findFirst({
				where: eq(userSettings.userId, ctx.user.id),
			});

			const merged = { ...(existing ?? {}), ...input };

			// Pull latest weight for macro calculation
			const latestWeight = await db.query.bodyMeasurements.findFirst({
				where: eq(bodyMeasurements.userId, ctx.user.id),
				orderBy: (m, { desc }) => [desc(m.date)],
				columns: { weightKg: true },
			});

			let macros: {
				targetCalories: number;
				targetProtein: number;
				targetCarbs: number;
				targetFat: number;
			} | null = null;

			if (
				latestWeight?.weightKg &&
				merged.heightCm &&
				merged.age &&
				merged.gender &&
				merged.goal
			) {
				const calc = calcMacros(
					latestWeight.weightKg,
					merged.heightCm,
					merged.age,
					merged.gender as "male" | "female",
					merged.goal as "bulk" | "cut" | "maintain",
				);
				macros = {
					targetCalories: calc.calories,
					targetProtein: calc.protein,
					targetCarbs: calc.carbs,
					targetFat: calc.fat,
				};
			}

			const values = {
				userId: ctx.user.id,
				heightCm: merged.heightCm ?? null,
				age: merged.age ?? null,
				gender: merged.gender ?? null,
				goal: merged.goal ?? null,
				dietPreference: merged.dietPreference ?? null,
				...(macros ?? {}),
			};

			if (existing) {
				const [updated] = await db
					.update(userSettings)
					.set(values)
					.where(eq(userSettings.userId, ctx.user.id))
					.returning();
				return updated;
			}

			const [created] = await db.insert(userSettings).values(values).returning();
			return created;
		}),
});
