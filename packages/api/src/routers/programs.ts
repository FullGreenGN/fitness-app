import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { programs } from "@fitness-app/db/schema/programs";
import { workouts } from "@fitness-app/db/schema/workouts";

import { protectedProcedure, router } from "../index";

export const programsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.query.programs.findMany({
      where: eq(programs.userId, ctx.user.id),
      with: { workouts: { with: { exercises: { with: { dictionary: true } } } } },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const program = await db.query.programs.findFirst({
        where: and(
          eq(programs.id, input.id),
          eq(programs.userId, ctx.user.id),
        ),
        with: {
          workouts: {
            orderBy: (w, { asc }) => [asc(w.name)],
            with: {
              exercises: {
                orderBy: (ex, { asc }) => [asc(ex.orderIndex)],
                with: { dictionary: true },
              },
            },
          },
        },
      });

      if (!program) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      return program;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [program] = await db
        .insert(programs)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
        })
        .returning();
      return program;
    }),

  createWorkout: protectedProcedure
    .input(
      z.object({
        programId: z.string().uuid(),
        name: z.string().min(1).max(200),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const program = await db.query.programs.findFirst({
        where: and(
          eq(programs.id, input.programId),
          eq(programs.userId, ctx.user.id),
        ),
        columns: { id: true },
      });

      if (!program) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      const [workout] = await db
        .insert(workouts)
        .values({
          programId: input.programId,
          name: input.name,
          notes: input.notes,
        })
        .returning();

      return workout;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const owned = await db.query.programs.findFirst({
        where: and(
          eq(programs.id, input.id),
          eq(programs.userId, ctx.user.id),
        ),
        columns: { id: true },
      });

      if (!owned) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      await db.delete(programs).where(eq(programs.id, input.id));

      return { deleted: input.id };
    }),
});
