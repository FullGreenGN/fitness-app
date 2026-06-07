import { TRPCError } from "@trpc/server";
import { eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { exerciseDictionary } from "@fitness-app/db/schema/exercise_dictionary";
import { exercises } from "@fitness-app/db/schema/exercises";
import { workouts } from "@fitness-app/db/schema/workouts";

import { protectedProcedure, router } from "../index";

export const exerciseDictionaryRouter = router({
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const q = input.query.trim();
      if (!q) {
        return db.query.exerciseDictionary.findMany({
          limit: 20,
          orderBy: (d, { asc }) => [asc(d.name)],
        });
      }
      return db.query.exerciseDictionary.findMany({
        where: ilike(exerciseDictionary.name, `%${q}%`),
        limit: 20,
        orderBy: (d, { asc }) => [asc(d.name)],
      });
    }),

  createGlobal: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        targetMuscle: z.string().max(100).optional(),
        imageUrl: z.string().url().optional(),
        youtubeUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [entry] = await db
        .insert(exerciseDictionary)
        .values({
          name: input.name,
          targetMuscle: input.targetMuscle,
          imageUrl: input.imageUrl,
          youtubeUrl: input.youtubeUrl,
          createdById: ctx.user.id,
        })
        .returning();
      return entry;
    }),

  addExerciseToWorkout: protectedProcedure
    .input(
      z.object({
        workoutId: z.string().uuid(),
        dictionaryId: z.string().uuid(),
        targetSets: z.number().int().min(1).default(3),
        targetReps: z.number().int().min(1).default(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workout = await db.query.workouts.findFirst({
        where: eq(workouts.id, input.workoutId),
        columns: { id: true },
        with: { program: { columns: { userId: true } } },
      });

      if (!workout || workout.program.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
      }

      const lastExercise = await db.query.exercises.findFirst({
        where: eq(exercises.workoutId, input.workoutId),
        columns: { orderIndex: true },
        orderBy: (ex, { desc }) => [desc(ex.orderIndex)],
      });

      const [exercise] = await db
        .insert(exercises)
        .values({
          workoutId: input.workoutId,
          dictionaryId: input.dictionaryId,
          orderIndex: (lastExercise?.orderIndex ?? -1) + 1,
          targetSets: input.targetSets,
          targetReps: input.targetReps,
        })
        .returning();

      return exercise;
    }),
});
