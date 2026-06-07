import { TRPCError } from "@trpc/server";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { foodDictionary, nutritionEntries, nutritionLogs } from "@fitness-app/db/schema/nutrition";
import { userSettings } from "@fitness-app/db/schema/user_settings";

// ─── Preset meal templates ────────────────────────────────────────────────────

const PRESETS = [
	// Standard diet
	{ name: "Chicken & Rice Bowl", brand: "GymTracker", servingSize: "1 bowl", calories: 550, protein: 45, carbs: 60, fat: 12, goals: ["bulk", "maintain"], diets: ["standard"] },
	{ name: "Oatmeal with Peanut Butter", brand: "GymTracker", servingSize: "1 bowl", calories: 420, protein: 16, carbs: 52, fat: 16, goals: ["bulk", "maintain"], diets: ["standard"] },
	{ name: "Salmon & Quinoa", brand: "GymTracker", servingSize: "1 plate", calories: 480, protein: 38, carbs: 42, fat: 15, goals: ["cut", "maintain"], diets: ["standard"] },
	{ name: "Greek Yogurt Protein Bowl", brand: "GymTracker", servingSize: "1 bowl", calories: 320, protein: 28, carbs: 35, fat: 8, goals: ["cut", "maintain"], diets: ["standard"] },
	{ name: "Mass Gainer Shake", brand: "GymTracker", servingSize: "1 shake", calories: 700, protein: 40, carbs: 90, fat: 14, goals: ["bulk"], diets: ["standard"] },
	// Vegan diet
	{ name: "Tofu Stir Fry", brand: "GymTracker", servingSize: "1 plate", calories: 420, protein: 24, carbs: 48, fat: 14, goals: ["bulk", "maintain"], diets: ["vegan"] },
	{ name: "Vegan Protein Smoothie", brand: "GymTracker", servingSize: "1 glass", calories: 380, protein: 30, carbs: 45, fat: 8, goals: ["bulk", "maintain"], diets: ["vegan"] },
	{ name: "Lentil & Chickpea Salad", brand: "GymTracker", servingSize: "1 bowl", calories: 350, protein: 20, carbs: 55, fat: 8, goals: ["cut", "maintain"], diets: ["vegan"] },
	{ name: "Tempeh Brown Rice Bowl", brand: "GymTracker", servingSize: "1 bowl", calories: 480, protein: 28, carbs: 58, fat: 14, goals: ["bulk", "maintain"], diets: ["vegan"] },
	// Keto diet
	{ name: "Avocado & Eggs", brand: "GymTracker", servingSize: "1 plate", calories: 480, protein: 22, carbs: 6, fat: 42, goals: ["bulk", "cut", "maintain"], diets: ["keto"] },
	{ name: "Tuna Salad", brand: "GymTracker", servingSize: "1 bowl", calories: 380, protein: 32, carbs: 4, fat: 26, goals: ["cut", "maintain"], diets: ["keto"] },
	{ name: "Keto Beef Bowl", brand: "GymTracker", servingSize: "1 bowl", calories: 520, protein: 38, carbs: 8, fat: 36, goals: ["bulk", "maintain"], diets: ["keto"] },
] as const;

import { protectedProcedure, router } from "../index";

// Open Food Facts response shape (only the fields we use)
interface OFFProduct {
	product_name?: string;
	brands?: string;
	image_front_url?: string;
	serving_size?: string;
	nutriments?: {
		"energy-kcal_100g"?: number;
		proteins_100g?: number;
		carbohydrates_100g?: number;
		fat_100g?: number;
	};
}
interface OFFResponse {
	status: number;
	product?: OFFProduct;
}

export const nutritionRouter = router({
	searchFood: protectedProcedure
		.input(z.object({ query: z.string() }))
		.query(async ({ input }) => {
			const q = input.query.trim();
			if (!q) {
				return db.query.foodDictionary.findMany({
					limit: 20,
					orderBy: (f, { asc }) => [asc(f.name)],
				});
			}
			return db.query.foodDictionary.findMany({
				where: ilike(foodDictionary.name, `%${q}%`),
				limit: 20,
				orderBy: (f, { asc }) => [asc(f.name)],
			});
		}),

	createFood: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(200),
				brand: z.string().max(200).optional(),
				calories: z.number().min(0),
				protein: z.number().min(0),
				carbs: z.number().min(0),
				fat: z.number().min(0),
				servingSize: z.string().min(1).max(100),
				barcode: z.string().max(50).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [food] = await db
				.insert(foodDictionary)
				.values({ ...input, createdById: ctx.user.id })
				.returning();
			return food;
		}),

	getDailyLog: protectedProcedure
		.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
		.query(async ({ ctx, input }) => {
			const log = await db.query.nutritionLogs.findFirst({
				where: and(eq(nutritionLogs.userId, ctx.user.id), eq(nutritionLogs.date, input.date)),
				with: {
					entries: {
						with: {
							food: true,
							meal: { with: { ingredients: { with: { food: true } } } },
						},
					},
				},
			});
			return log ?? null;
		}),

	logEntry: protectedProcedure
		.input(
			z.object({
				date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				foodId: z.string().uuid().optional(),
				mealId: z.string().uuid().optional(),
				quantity: z.number().positive(),
				mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let log = await db.query.nutritionLogs.findFirst({
				where: and(eq(nutritionLogs.userId, ctx.user.id), eq(nutritionLogs.date, input.date)),
				columns: { id: true },
			});

			if (!log) {
				[log] = await db
					.insert(nutritionLogs)
					.values({ userId: ctx.user.id, date: input.date })
					.returning({ id: nutritionLogs.id });
			}

			const [entry] = await db
				.insert(nutritionEntries)
				.values({
					logId: log.id,
					foodId: input.foodId,
					mealId: input.mealId,
					quantity: input.quantity,
					mealType: input.mealType,
				})
				.returning();

			return entry;
		}),

	// Returns preset meals filtered by the user's goal and diet preference
	getPresetMeals: protectedProcedure.query(async ({ ctx }) => {
		const settings = await db.query.userSettings.findFirst({
			where: eq(userSettings.userId, ctx.user.id),
			columns: { goal: true, dietPreference: true },
		});

		const goal = settings?.goal ?? "maintain";
		const diet = settings?.dietPreference ?? "standard";

		return PRESETS.filter(
			(p) => p.goals.includes(goal as never) && p.diets.includes(diet as never),
		).map(({ goals: _g, diets: _d, ...rest }) => rest);
	}),

	// Creates food in dictionary (deduplicates by barcode) then logs the entry.
	// Used by both the barcode scanner confirmation and the manual entry form.
	logQuickFood: protectedProcedure
		.input(
			z.object({
				date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
				quantity: z.number().positive(),
				name: z.string().min(1),
				brand: z.string().optional(),
				servingSize: z.string().default("100g"),
				calories: z.number().min(0),
				protein: z.number().min(0),
				carbs: z.number().min(0),
				fat: z.number().min(0),
				barcode: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { date, mealType, quantity, barcode, ...foodData } = input;

			// Deduplicate by barcode when available, otherwise always create
			let food: typeof foodDictionary.$inferSelect | undefined;
			if (barcode) {
				[food] = await db
					.select()
					.from(foodDictionary)
					.where(eq(foodDictionary.barcode, barcode))
					.limit(1);
			}
			if (!food) {
				[food] = await db
					.insert(foodDictionary)
					.values({ ...foodData, barcode: barcode ?? null, createdById: ctx.user.id })
					.returning();
			}

			// Get or create the daily log
			let log = await db.query.nutritionLogs.findFirst({
				where: and(eq(nutritionLogs.userId, ctx.user.id), eq(nutritionLogs.date, date)),
				columns: { id: true },
			});
			if (!log) {
				[log] = await db
					.insert(nutritionLogs)
					.values({ userId: ctx.user.id, date })
					.returning({ id: nutritionLogs.id });
			}

			const [entry] = await db
				.insert(nutritionEntries)
				.values({ logId: log.id, foodId: food.id, quantity, mealType })
				.returning();
			return entry;
		}),

	scanBarcode: protectedProcedure
		.input(z.object({ barcode: z.string().min(1) }))
		.mutation(async ({ input }) => {
			const res = await fetch(
				`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(input.barcode)}.json`,
				{ headers: { "User-Agent": "GymTracker/1.0" } },
			);

			if (!res.ok) {
				throw new TRPCError({
					code: "BAD_GATEWAY",
					message: "Failed to reach Open Food Facts",
				});
			}

			const data = (await res.json()) as OFFResponse;

			if (data.status !== 1 || !data.product) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
			}

			const p = data.product;
			const n = p.nutriments ?? {};

			return {
				name: p.product_name ?? "Unknown Product",
				brand: p.brands ?? null,
				imageUrl: p.image_front_url ?? null,
				servingSize: p.serving_size ?? "100g",
				calories: n["energy-kcal_100g"] ?? 0,
				protein: n.proteins_100g ?? 0,
				carbs: n.carbohydrates_100g ?? 0,
				fat: n.fat_100g ?? 0,
			};
		}),
});
