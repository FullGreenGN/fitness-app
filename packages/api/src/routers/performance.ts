import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { bodyMeasurements } from "@fitness-app/db/schema/body_measurements";
import { exerciseDictionary } from "@fitness-app/db/schema/exercise_dictionary";
import { exercises } from "@fitness-app/db/schema/exercises";
import { programs } from "@fitness-app/db/schema/programs";
import { sets } from "@fitness-app/db/schema/sets";
import { workouts } from "@fitness-app/db/schema/workouts";

import { protectedProcedure, router } from "../index";

export const performanceRouter = router({
	getBodyMetrics: protectedProcedure.query(async ({ ctx }) => {
		return db.query.bodyMeasurements.findMany({
			where: eq(bodyMeasurements.userId, ctx.user.id),
			orderBy: (m, { asc }) => [asc(m.date)],
		});
	}),

	logMeasurement: protectedProcedure
		.input(
			z.object({
				date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				weightKg: z.number().positive().optional(),
				bodyFatPercentage: z.number().min(0).max(100).optional(),
				chestCm: z.number().positive().optional(),
				armsCm: z.number().positive().optional(),
				waistCm: z.number().positive().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.insert(bodyMeasurements)
				.values({ userId: ctx.user.id, ...input })
				.returning();
			return row;
		}),

	// Returns every distinct exercise type the user has ever trained
	getUserExercises: protectedProcedure.query(async ({ ctx }) => {
		return db
			.selectDistinct({
				dictId: exerciseDictionary.id,
				name: exerciseDictionary.name,
			})
			.from(exercises)
			.innerJoin(workouts, eq(exercises.workoutId, workouts.id))
			.innerJoin(programs, eq(workouts.programId, programs.id))
			.innerJoin(exerciseDictionary, eq(exercises.dictionaryId, exerciseDictionary.id))
			.where(eq(programs.userId, ctx.user.id))
			.orderBy(exerciseDictionary.name);
	}),

	// Max weight logged per calendar day for a given exercise (for progression chart)
	getExerciseProgression: protectedProcedure
		.input(z.object({ dictionaryId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return db
				.select({
					date: sql<string>`DATE(${sets.completedAt})::text`,
					maxWeight: sql<number>`MAX(${sets.weight})`,
				})
				.from(sets)
				.innerJoin(exercises, eq(sets.exerciseId, exercises.id))
				.innerJoin(workouts, eq(exercises.workoutId, workouts.id))
				.innerJoin(programs, eq(workouts.programId, programs.id))
				.where(
					and(
						eq(exercises.dictionaryId, input.dictionaryId),
						eq(programs.userId, ctx.user.id),
						isNotNull(sets.completedAt),
						isNotNull(sets.weight),
					),
				)
				.groupBy(sql`DATE(${sets.completedAt})`)
				.orderBy(sql`DATE(${sets.completedAt}) ASC`);
		}),
});
