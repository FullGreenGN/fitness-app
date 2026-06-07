import { relations } from "drizzle-orm";
import { integer, pgTable, real, timestamp, uuid } from "drizzle-orm/pg-core";

import { exercises } from "./exercises";

export const sets = pgTable("sets", {
    id: uuid("id").defaultRandom().primaryKey(),
    exerciseId: uuid("exercise_id")
        .notNull()
        .references(() => exercises.id, { onDelete: "cascade" }),
    weight: real("weight").notNull(),
    reps: integer("reps").notNull(),
    isWarmup: integer("is_warmup").default(0),
    completedAt: timestamp("completed_at").defaultNow(),
});

export const setsRelations = relations(sets, ({ one }) => ({
    exercise: one(exercises, {
        fields: [sets.exerciseId],
        references: [exercises.id],
    }),
}));
