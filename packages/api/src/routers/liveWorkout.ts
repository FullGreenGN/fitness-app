import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { exercises } from "@fitness-app/db/schema/exercises";
import { programs } from "@fitness-app/db/schema/programs";
import { sets } from "@fitness-app/db/schema/sets";
import { workouts } from "@fitness-app/db/schema/workouts";

import { protectedProcedure, router } from "../index";

// ─── Ownership helpers ────────────────────────────────────────────────────────
// Each helper does a single join up to programs.userId so we never trust a
// client-supplied ID without confirming the row belongs to the session user.

async function assertExerciseOwnership(exerciseId: string, userId: string) {
  const row = await db
    .select({ exerciseId: exercises.id })
    .from(exercises)
    .innerJoin(workouts, eq(exercises.workoutId, workouts.id))
    .innerJoin(programs, eq(workouts.programId, programs.id))
    .where(and(eq(exercises.id, exerciseId), eq(programs.userId, userId)))
    .limit(1);

  if (row.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Exercise not found" });
  }
}

async function assertSetOwnership(setId: string, userId: string) {
  const row = await db
    .select({ setId: sets.id })
    .from(sets)
    .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
    .innerJoin(workouts, eq(exercises.workoutId, workouts.id))
    .innerJoin(programs, eq(workouts.programId, programs.id))
    .where(and(eq(sets.id, setId), eq(programs.userId, userId)))
    .limit(1);

  if (row.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Set not found" });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const liveWorkoutRouter = router({
  /**
   * Load a workout with its exercises (ordered by orderIndex) and each
   * exercise's logged sets (ordered by completedAt). Used to hydrate the
   * live workout screen on session start.
   */
  getWorkout: protectedProcedure
    .input(z.object({ workoutId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const workout = await db.query.workouts.findFirst({
        where: eq(workouts.id, input.workoutId),
        with: {
          // Fetch userId for ownership check, stripped from the return value below
          program: { columns: { userId: true } },
          exercises: {
            orderBy: (ex, { asc }) => [asc(ex.orderIndex)],
            with: {
              dictionary: true,
              sets: { orderBy: (s, { asc }) => [asc(s.completedAt)] },
            },
          },
        },
      });

      if (!workout || workout.program.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
      }

      const { program: _program, ...workoutData } = workout;
      return workoutData;
    }),

  /**
   * Record a completed set for an exercise. Called when the user taps the
   * checkmark on the live workout screen.
   */
  logSet: protectedProcedure
    .input(
      z.object({
        exerciseId: z.string().uuid(),
        weight: z.number().min(0),
        reps: z.number().int().min(1),
        isWarmup: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertExerciseOwnership(input.exerciseId, ctx.user.id);

      const [set] = await db
        .insert(sets)
        .values({
          exerciseId: input.exerciseId,
          weight: input.weight,
          reps: input.reps,
          isWarmup: input.isWarmup ? 1 : 0,
        })
        .returning();

      return set;
    }),

  /**
   * Edit weight or reps on a previously logged set. For mid-session
   * corrections.
   */
  updateSet: protectedProcedure
    .input(
      z.object({
        setId: z.string().uuid(),
        weight: z.number().min(0),
        reps: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertSetOwnership(input.setId, ctx.user.id);

      const [updated] = await db
        .update(sets)
        .set({ weight: input.weight, reps: input.reps })
        .where(eq(sets.id, input.setId))
        .returning();

      return updated;
    }),

  /**
   * Remove a logged set. Fires when the user taps the X on a set row.
   */
  removeSet: protectedProcedure
    .input(z.object({ setId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertSetOwnership(input.setId, ctx.user.id);

      await db.delete(sets).where(eq(sets.id, input.setId));

      return { deleted: input.setId };
    }),

  /**
   * Insert a set for a past session with a specific date. The completedAt
   * timestamp is pinned to noon UTC on the given date so the history query
   * (which groups by DATE(completedAt)) always lands on the correct day.
   */
  addHistoricalSet: protectedProcedure
    .input(
      z.object({
        exerciseId: z.string().uuid(),
        weight: z.number().min(0),
        reps: z.number().int().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertExerciseOwnership(input.exerciseId, ctx.user.id);

      const [set] = await db
        .insert(sets)
        .values({
          exerciseId: input.exerciseId,
          weight: input.weight,
          reps: input.reps,
          completedAt: new Date(`${input.date}T12:00:00.000Z`),
        })
        .returning();

      return set;
    }),

  /**
   * Returns the workout that has sets logged within the last 12 hours,
   * so the home screen can offer a "Continue Workout" shortcut.
   */
  currentWorkout: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        workoutId: workouts.id,
        workoutName: workouts.name,
        programName: programs.name,
      })
      .from(sets)
      .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
      .innerJoin(workouts, eq(exercises.workoutId, workouts.id))
      .innerJoin(programs, eq(workouts.programId, programs.id))
      .where(
        and(
          eq(programs.userId, ctx.user.id),
          isNotNull(sets.completedAt),
          sql`${sets.completedAt} >= NOW() - INTERVAL '12 hours'`,
        ),
      )
      .groupBy(workouts.id, workouts.name, programs.name)
      .orderBy(sql`MAX(${sets.completedAt}) DESC`)
      .limit(1);

    return rows[0] ?? null;
  }),
});
