import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

import { exercises } from "./exercises";
import { programs } from "./programs";

export const workouts = pgTable("workouts", {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
        .notNull()
        .references(() => programs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
});

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
    program: one(programs, {
        fields: [workouts.programId],
        references: [programs.id],
    }),
    exercises: many(exercises),
}));
