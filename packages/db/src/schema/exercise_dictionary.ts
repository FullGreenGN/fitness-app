import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { exercises } from "./exercises";

export const exerciseDictionary = pgTable("exercise_dictionary", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    targetMuscle: text("target_muscle"),
    imageUrl: text("image_url"),
    youtubeUrl: text("youtube_url"),
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exerciseDictionaryRelations = relations(exerciseDictionary, ({ one, many }) => ({
    createdBy: one(user, {
        fields: [exerciseDictionary.createdById],
        references: [user.id],
    }),
    exercises: many(exercises),
}));
