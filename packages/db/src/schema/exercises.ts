import { relations } from "drizzle-orm";
import { integer, pgTable, uuid } from "drizzle-orm/pg-core";

import { exerciseDictionary } from "./exercise_dictionary";
import { sets } from "./sets";
import { workouts } from "./workouts";

export const exercises = pgTable("exercises", {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutId: uuid("workout_id")
        .notNull()
        .references(() => workouts.id, { onDelete: "cascade" }),
    dictionaryId: uuid("dictionary_id")
        .notNull()
        .references(() => exerciseDictionary.id, { onDelete: "restrict" }),
    orderIndex: integer("order_index").notNull(),
    targetSets: integer("target_sets").default(3).notNull(),
    targetReps: integer("target_reps").default(10).notNull(),
    restSeconds: integer("rest_seconds").default(90).notNull(),
});

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
    workout: one(workouts, {
        fields: [exercises.workoutId],
        references: [workouts.id],
    }),
    dictionary: one(exerciseDictionary, {
        fields: [exercises.dictionaryId],
        references: [exerciseDictionary.id],
    }),
    sets: many(sets),
}));
