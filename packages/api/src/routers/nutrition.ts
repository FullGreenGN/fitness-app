import { TRPCError } from "@trpc/server";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { foodDictionary, nutritionEntries, nutritionLogs } from "@fitness-app/db/schema/nutrition";

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
