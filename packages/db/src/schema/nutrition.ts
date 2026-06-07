import { relations } from "drizzle-orm";
import { pgTable, real, text, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

// ─── Tables ───────────────────────────────────────────────────────────────────

export const foodDictionary = pgTable("food_dictionary", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	brand: text("brand"),
	calories: real("calories").notNull(),
	protein: real("protein").notNull(),
	carbs: real("carbs").notNull(),
	fat: real("fat").notNull(),
	servingSize: text("serving_size").notNull(),
	barcode: text("barcode"),
	createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
});

export const meals = pgTable("meals", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
});

export const mealIngredients = pgTable("meal_ingredients", {
	id: uuid("id").defaultRandom().primaryKey(),
	mealId: uuid("meal_id")
		.notNull()
		.references(() => meals.id, { onDelete: "cascade" }),
	foodId: uuid("food_id")
		.notNull()
		.references(() => foodDictionary.id, { onDelete: "restrict" }),
	quantity: real("quantity").notNull(),
});

export const nutritionLogs = pgTable(
	"nutrition_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		date: text("date").notNull(),
	},
	(table) => [unique("nutrition_logs_user_date_uniq").on(table.userId, table.date)],
);

export const nutritionEntries = pgTable("nutrition_entries", {
	id: uuid("id").defaultRandom().primaryKey(),
	logId: uuid("log_id")
		.notNull()
		.references(() => nutritionLogs.id, { onDelete: "cascade" }),
	foodId: uuid("food_id").references(() => foodDictionary.id, { onDelete: "set null" }),
	mealId: uuid("meal_id").references(() => meals.id, { onDelete: "set null" }),
	quantity: real("quantity").notNull(),
	mealType: text("meal_type").notNull(), // 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const foodDictionaryRelations = relations(foodDictionary, ({ many }) => ({
	mealIngredients: many(mealIngredients),
	nutritionEntries: many(nutritionEntries),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
	user: one(user, { fields: [meals.userId], references: [user.id] }),
	ingredients: many(mealIngredients),
	nutritionEntries: many(nutritionEntries),
}));

export const mealIngredientsRelations = relations(mealIngredients, ({ one }) => ({
	meal: one(meals, { fields: [mealIngredients.mealId], references: [meals.id] }),
	food: one(foodDictionary, { fields: [mealIngredients.foodId], references: [foodDictionary.id] }),
}));

export const nutritionLogsRelations = relations(nutritionLogs, ({ one, many }) => ({
	user: one(user, { fields: [nutritionLogs.userId], references: [user.id] }),
	entries: many(nutritionEntries),
}));

export const nutritionEntriesRelations = relations(nutritionEntries, ({ one }) => ({
	log: one(nutritionLogs, { fields: [nutritionEntries.logId], references: [nutritionLogs.id] }),
	food: one(foodDictionary, { fields: [nutritionEntries.foodId], references: [foodDictionary.id] }),
	meal: one(meals, { fields: [nutritionEntries.mealId], references: [meals.id] }),
}));
