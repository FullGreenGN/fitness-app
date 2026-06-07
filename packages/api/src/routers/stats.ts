import { and, eq, isNotNull, sql } from "drizzle-orm";

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
