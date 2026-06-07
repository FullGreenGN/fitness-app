import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { exercises } from "@fitness-app/db/schema/exercises";
import { programs } from "@fitness-app/db/schema/programs";
import { sets } from "@fitness-app/db/schema/sets";
import { workouts } from "@fitness-app/db/schema/workouts";

import { protectedProcedure, router } from "../index";

export const statsRouter = router({
	/**
	 * Returns past workout sessions (grouped by workout + day), most recent first.
	 * A "session" = all non-warmup sets for a given workout logged on the same calendar day.
	 */
	workoutHistory: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				workoutId: workouts.id,
				workoutName: workouts.name,
				programName: programs.name,
				date: sql<string>`DATE(${sets.completedAt})::text`,
				setCount: sql<number>`COUNT(${sets.id})::integer`,
				exerciseCount: sql<number>`COUNT(DISTINCT ${exercises.id})::integer`,
				volume: sql<number>`ROUND(SUM(${sets.weight} * ${sets.reps}))::integer`,
			})
			.from(sets)
			.innerJoin(exercises, eq(sets.exerciseId, exercises.id))
			.innerJoin(workouts, eq(exercises.workoutId, workouts.id))
			.innerJoin(programs, eq(workouts.programId, programs.id))
			.where(
				and(
					eq(programs.userId, ctx.user.id),
					isNotNull(sets.completedAt),
					sql`(${sets.isWarmup} = 0 OR ${sets.isWarmup} IS NULL)`,
				),
			)
			.groupBy(workouts.id, workouts.name, programs.name, sql`DATE(${sets.completedAt})`)
			.orderBy(sql`DATE(${sets.completedAt}) DESC`)
			.limit(30);

		return rows;
	}),

	/**
	 * Returns all exercises + their sets for a specific workout on a specific date.
	 * Used by the session history detail page to allow full CRUD on past sets.
	 */
	getSessionDetail: protectedProcedure
		.input(
			z.object({
				workoutId: z.string().uuid(),
				date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
			}),
		)
		.query(async ({ ctx, input }) => {
			const workout = await db.query.workouts.findFirst({
				where: eq(workouts.id, input.workoutId),
				columns: { id: true, name: true },
				with: {
					program: { columns: { userId: true } },
					exercises: {
						orderBy: (ex, { asc }) => [asc(ex.orderIndex)],
						columns: { id: true },
						with: { dictionary: { columns: { name: true } } },
					},
				},
			});

			if (!workout || workout.program.userId !== ctx.user.id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
			}

			const exerciseIds = workout.exercises.map((ex) => ex.id);
			if (exerciseIds.length === 0) {
				return { workoutName: workout.name, exercises: [] };
			}

			const sessionSets = await db
				.select()
				.from(sets)
				.where(
					and(
						inArray(sets.exerciseId, exerciseIds),
						sql`DATE(${sets.completedAt}) = ${input.date}::date`,
					),
				)
				.orderBy(asc(sets.completedAt));

			// Group sets by exerciseId for easy lookup
			const setsByExercise = new Map<string, typeof sessionSets>();
			for (const s of sessionSets) {
				const arr = setsByExercise.get(s.exerciseId) ?? [];
				arr.push(s);
				setsByExercise.set(s.exerciseId, arr);
			}

			return {
				workoutName: workout.name,
				exercises: workout.exercises
					.map((ex) => ({
						id: ex.id,
						name: ex.dictionary.name,
						sets: setsByExercise.get(ex.id) ?? [],
					}))
					.filter((ex) => ex.sets.length > 0),
			};
		}),

	/**
	 * Returns daily training volume (kg × reps) for the last 30 days.
	 * Days with no training are omitted — the client fills them in as 0.
	 */
	volumeByDay: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				date: sql<string>`DATE(${sets.completedAt})::text`,
				volume: sql<number>`ROUND(SUM(${sets.weight} * ${sets.reps}))::integer`,
			})
			.from(sets)
			.innerJoin(exercises, eq(sets.exerciseId, exercises.id))
			.innerJoin(workouts, eq(exercises.workoutId, workouts.id))
			.innerJoin(programs, eq(workouts.programId, programs.id))
			.where(
				and(
					eq(programs.userId, ctx.user.id),
					isNotNull(sets.completedAt),
					sql`${sets.completedAt} >= NOW() - INTERVAL '30 days'`,
					sql`(${sets.isWarmup} = 0 OR ${sets.isWarmup} IS NULL)`,
				),
			)
			.groupBy(sql`DATE(${sets.completedAt})`)
			.orderBy(sql`DATE(${sets.completedAt}) ASC`);

		return rows;
	}),
});
