import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@fitness-app/db";
import { exerciseDictionary } from "@fitness-app/db/schema/exercise_dictionary";
import { exercises } from "@fitness-app/db/schema/exercises";
import { programs } from "@fitness-app/db/schema/programs";
import { workouts } from "@fitness-app/db/schema/workouts";

import { protectedProcedure, router } from "../index";
import { PRESETS } from "../presets";

// ─── Clone helper ─────────────────────────────────────────────────────────────

async function cloneProgramForUser(
	source: {
		name: string;
		description: string | null;
		workouts: Array<{
			name: string;
			notes: string | null;
			exercises: Array<{
				dictionaryId: string;
				orderIndex: number;
				targetSets: number;
				targetReps: number;
				restSeconds: number;
			}>;
		}>;
	},
	userId: string,
) {
	const [newProgram] = await db
		.insert(programs)
		.values({ userId, name: source.name, description: source.description })
		.returning();

	for (const w of source.workouts) {
		const [newWorkout] = await db
			.insert(workouts)
			.values({ programId: newProgram.id, name: w.name, notes: w.notes })
			.returning();

		if (w.exercises.length > 0) {
			await db.insert(exercises).values(
				w.exercises.map((ex, i) => ({
					workoutId: newWorkout.id,
					dictionaryId: ex.dictionaryId,
					orderIndex: i,
					targetSets: ex.targetSets,
					targetReps: ex.targetReps,
					restSeconds: ex.restSeconds,
				})),
			);
		}
	}

	return newProgram;
}

// ─── Router ───────────────────────────────────────────────────────────────────

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

	// ─── Sharing ──────────────────────────────────────────────────────────────

	share: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const program = await db.query.programs.findFirst({
				where: and(
					eq(programs.id, input.id),
					eq(programs.userId, ctx.user.id),
				),
				columns: { id: true, shareCode: true },
			});

			if (!program) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
			}

			if (program.shareCode) return { shareCode: program.shareCode };

			const shareCode = crypto
				.randomUUID()
				.replace(/-/g, "")
				.slice(0, 8)
				.toUpperCase();

			await db
				.update(programs)
				.set({ shareCode })
				.where(eq(programs.id, input.id));

			return { shareCode };
		}),

	importFromCode: protectedProcedure
		.input(z.object({ code: z.string().min(1).max(20) }))
		.mutation(async ({ ctx, input }) => {
			const source = await db.query.programs.findFirst({
				where: eq(programs.shareCode, input.code.trim().toUpperCase()),
				with: {
					workouts: {
						with: {
							exercises: { orderBy: (ex, { asc }) => [asc(ex.orderIndex)] },
						},
					},
				},
			});

			if (!source) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Invalid share code" });
			}

			const cloned = await cloneProgramForUser(source, ctx.user.id);
			return cloned;
		}),

	// ─── Presets ──────────────────────────────────────────────────────────────

	getPresets: protectedProcedure.query(() =>
		PRESETS.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			workoutCount: p.workouts.length,
			exerciseCount: p.workouts.reduce((s, w) => s + w.exercises.length, 0),
		})),
	),

	updateExercise: protectedProcedure
		.input(
			z.object({
				exerciseId: z.string().uuid(),
				targetSets: z.number().int().min(1).optional(),
				targetReps: z.number().int().min(1).optional(),
				restSeconds: z.number().int().min(0).max(600).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const row = await db
				.select({ id: exercises.id })
				.from(exercises)
				.innerJoin(workouts, eq(exercises.workoutId, workouts.id))
				.innerJoin(programs, eq(workouts.programId, programs.id))
				.where(and(eq(exercises.id, input.exerciseId), eq(programs.userId, ctx.user.id)))
				.limit(1);

			if (row.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Exercise not found" });
			}

			const patch: Partial<typeof exercises.$inferInsert> = {};
			if (input.targetSets !== undefined) patch.targetSets = input.targetSets;
			if (input.targetReps !== undefined) patch.targetReps = input.targetReps;
			if (input.restSeconds !== undefined) patch.restSeconds = input.restSeconds;

			const [updated] = await db
				.update(exercises)
				.set(patch)
				.where(eq(exercises.id, input.exerciseId))
				.returning();

			return updated;
		}),

	importPreset: protectedProcedure
		.input(z.object({ presetId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const preset = PRESETS.find((p) => p.id === input.presetId);
			if (!preset) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Preset not found" });
			}

			const exerciseNames = [
				...new Set(
					preset.workouts.flatMap((w) => w.exercises.map((e) => e.name)),
				),
			];

			const dictEntries = await db
				.select({ id: exerciseDictionary.id, name: exerciseDictionary.name })
				.from(exerciseDictionary)
				.where(inArray(exerciseDictionary.name, exerciseNames));

			const nameToId = Object.fromEntries(
				dictEntries.map((e) => [e.name, e.id]),
			);

			const [program] = await db
				.insert(programs)
				.values({
					userId: ctx.user.id,
					name: preset.name,
					description: preset.description,
				})
				.returning();

			for (const workoutDef of preset.workouts) {
				const [workout] = await db
					.insert(workouts)
					.values({ programId: program.id, name: workoutDef.name })
					.returning();

				const rows = workoutDef.exercises
					.map((ex, i) => {
						const dictionaryId = nameToId[ex.name];
						if (!dictionaryId) return null;
						return {
							workoutId: workout.id,
							dictionaryId,
							orderIndex: i,
							targetSets: ex.sets,
							targetReps: ex.reps,
						};
					})
					.filter((r): r is NonNullable<typeof r> => r !== null);

				if (rows.length > 0) {
					await db.insert(exercises).values(rows);
				}
			}

			return program;
		}),
});
