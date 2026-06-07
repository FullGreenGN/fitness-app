import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { workouts } from "./workouts";

export const programs = pgTable("programs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    shareCode: text("share_code").unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programsRelations = relations(programs, ({ one, many }) => ({
    user: one(user, {
        fields: [programs.userId],
        references: [user.id],
    }),
    workouts: many(workouts),
}));
