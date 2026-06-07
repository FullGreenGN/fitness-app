import { relations } from "drizzle-orm";
import { integer, pgTable, real, text, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userSettings = pgTable("user_settings", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
	heightCm: real("height_cm"),
	age: integer("age"),
	gender: text("gender"), // 'male' | 'female'
	goal: text("goal"), // 'bulk' | 'cut' | 'maintain'
	dietPreference: text("diet_preference"), // 'standard' | 'vegan' | 'keto'
	targetCalories: real("target_calories"),
	targetProtein: real("target_protein"),
	targetCarbs: real("target_carbs"),
	targetFat: real("target_fat"),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(user, { fields: [userSettings.userId], references: [user.id] }),
}));
