import { relations } from "drizzle-orm";
import { pgTable, real, text, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const bodyMeasurements = pgTable("body_measurements", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	date: text("date").notNull(), // YYYY-MM-DD
	weightKg: real("weight_kg"),
	bodyFatPercentage: real("body_fat_percentage"),
	chestCm: real("chest_cm"),
	armsCm: real("arms_cm"),
	waistCm: real("waist_cm"),
});

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
	user: one(user, { fields: [bodyMeasurements.userId], references: [user.id] }),
}));
