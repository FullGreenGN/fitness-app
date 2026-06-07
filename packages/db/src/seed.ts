import dotenv from "dotenv";

dotenv.config({ path: "../../apps/server/.env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { exerciseDictionary } from "./schema/exercise_dictionary";

const db = drizzle(process.env.DATABASE_URL!);

const BASE_IMG =
	"https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const YT = "https://www.youtube.com/watch?v=";

const exercises = [
	// ── CHEST ──────────────────────────────────────────────────────────────
	{
		name: "Barbell Bench Press",
		targetMuscle: "chest",
		imageUrl: `${BASE_IMG}/Barbell_Bench_Press_-_Medium_Grip/images/0.jpg`,
		youtubeUrl: `${YT}vcBig73ojpE`, // Jeff Nippard — perfect bench technique
	},
	{
		name: "Incline Dumbbell Press",
		targetMuscle: "chest",
		imageUrl: `${BASE_IMG}/Dumbbell_Incline_Press/images/0.jpg`,
		youtubeUrl: `${YT}vcBig73ojpE`,
	},
	{
		name: "Push-Up",
		targetMuscle: "chest",
		imageUrl: `${BASE_IMG}/Pushups/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── UPPER BACK ─────────────────────────────────────────────────────────
	{
		name: "Pull-Up",
		targetMuscle: "upper-back",
		imageUrl: `${BASE_IMG}/Pull-Ups/images/0.jpg`,
		youtubeUrl: `${YT}Hdc7Mw6BIEE`, // Jeff Nippard — pull-ups for a wide back
	},
	{
		name: "Lat Pulldown",
		targetMuscle: "upper-back",
		imageUrl: `${BASE_IMG}/Wide-Grip_Lat_Pulldown/images/0.jpg`,
		youtubeUrl: `${YT}O94yEoGXtBY`, // Jeff Nippard — V-tapered back
	},
	{
		name: "Barbell Bent-Over Row",
		targetMuscle: "upper-back",
		imageUrl: `${BASE_IMG}/Barbell_Bent_Over_Row/images/0.jpg`,
		youtubeUrl: `${YT}PAXkl-AdJFg`, // Jeff Nippard — back width vs thickness
	},
	{
		name: "Seated Cable Row",
		targetMuscle: "upper-back",
		imageUrl: `${BASE_IMG}/Seated_Cable_Rows/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── FRONT DELTOIDS ─────────────────────────────────────────────────────
	{
		name: "Overhead Press",
		targetMuscle: "front-deltoids",
		imageUrl: `${BASE_IMG}/Barbell_Standing_Military_Press/images/0.jpg`,
		youtubeUrl: `${YT}_RlRDWO2jfg`, // Jeff Nippard — overhead press technique
	},
	{
		name: "Lateral Raise",
		targetMuscle: "front-deltoids",
		imageUrl: `${BASE_IMG}/Side_Lateral_Raise/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── BACK DELTOIDS ──────────────────────────────────────────────────────
	{
		name: "Rear Delt Fly",
		targetMuscle: "back-deltoids",
		imageUrl: `${BASE_IMG}/Bent_Over_Dumbbell_Rear_Delt_Raise_with_Head_on_Bench/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── BICEPS ─────────────────────────────────────────────────────────────
	{
		name: "Barbell Curl",
		targetMuscle: "biceps",
		imageUrl: `${BASE_IMG}/Barbell_Curl/images/0.jpg`,
		youtubeUrl: `${YT}i1YgFZB6alI`, // Jeff Nippard — huge biceps training
	},
	{
		name: "Hammer Curl",
		targetMuscle: "biceps",
		imageUrl: `${BASE_IMG}/Dumbbell_Hammer_Curl/images/0.jpg`,
		youtubeUrl: `${YT}i1YgFZB6alI`,
	},
	// ── TRICEPS ────────────────────────────────────────────────────────────
	{
		name: "Skull Crusher",
		targetMuscle: "triceps",
		imageUrl: `${BASE_IMG}/EZ-Bar_Skullcrusher/images/0.jpg`,
		youtubeUrl: `${YT}popGXI-qs98`, // Jeff Nippard — huge triceps technique
	},
	{
		name: "Tricep Dips",
		targetMuscle: "triceps",
		imageUrl: `${BASE_IMG}/Dips_-_Triceps_Version/images/0.jpg`,
		youtubeUrl: `${YT}popGXI-qs98`,
	},
	// ── QUADRICEPS ─────────────────────────────────────────────────────────
	{
		name: "Barbell Squat",
		targetMuscle: "quadriceps",
		imageUrl: `${BASE_IMG}/Barbell_Full_Squat/images/0.jpg`,
		youtubeUrl: `${YT}bEv6CCg2BC8`, // Jeff Nippard — squat technique
	},
	{
		name: "Leg Press",
		targetMuscle: "quadriceps",
		imageUrl: `${BASE_IMG}/Leg_Press/images/0.jpg`,
		youtubeUrl: `${YT}Y4Vv2ASsyhs`, // Jeff Nippard — science-based leg workout
	},
	{
		name: "Barbell Lunge",
		targetMuscle: "quadriceps",
		imageUrl: `${BASE_IMG}/Barbell_Lunge/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── HAMSTRINGS ─────────────────────────────────────────────────────────
	{
		name: "Romanian Deadlift",
		targetMuscle: "hamstring",
		imageUrl: `${BASE_IMG}/Romanian_Deadlift/images/0.jpg`,
		youtubeUrl: `${YT}_oyxCn2iSjU`, // Jeff Nippard — RDL for beefy hamstrings
	},
	{
		name: "Leg Curl",
		targetMuscle: "hamstring",
		imageUrl: `${BASE_IMG}/Lying_Leg_Curls/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── GLUTES ─────────────────────────────────────────────────────────────
	{
		name: "Hip Thrust",
		targetMuscle: "gluteal",
		imageUrl: `${BASE_IMG}/Barbell_Hip_Thrust/images/0.jpg`,
		youtubeUrl: `${YT}xDmFkJxPzeM`, // Jeff Nippard — hip thrust technique
	},
	// ── LOWER BACK ─────────────────────────────────────────────────────────
	{
		name: "Barbell Deadlift",
		targetMuscle: "lower-back",
		imageUrl: `${BASE_IMG}/Barbell_Deadlift/images/0.jpg`,
		youtubeUrl: `${YT}Y1IGeJEXpF4`, // Alan Thrall — how to deadlift
	},
	// ── ABS ────────────────────────────────────────────────────────────────
	{
		name: "Plank",
		targetMuscle: "abs",
		imageUrl: `${BASE_IMG}/Elbow_Plank/images/0.jpg`,
		youtubeUrl: null,
	},
	{
		name: "Cable Crunch",
		targetMuscle: "abs",
		imageUrl: `${BASE_IMG}/Cable_Crunch/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── OBLIQUES ───────────────────────────────────────────────────────────
	{
		name: "Russian Twist",
		targetMuscle: "obliques",
		imageUrl: `${BASE_IMG}/Russian_Twist/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── CALVES ─────────────────────────────────────────────────────────────
	{
		name: "Standing Calf Raise",
		targetMuscle: "calves",
		imageUrl: `${BASE_IMG}/Standing_Calf_Raises/images/0.jpg`,
		youtubeUrl: `${YT}xLikAVQTKqc`, // Jeff Nippard — calf training science
	},
	// ── TRAPEZIUS ──────────────────────────────────────────────────────────
	{
		name: "Barbell Shrug",
		targetMuscle: "trapezius",
		imageUrl: `${BASE_IMG}/Barbell_Shrug/images/0.jpg`,
		youtubeUrl: null,
	},
	// ── FOREARM ────────────────────────────────────────────────────────────
	{
		name: "Wrist Curl",
		targetMuscle: "forearm",
		imageUrl: `${BASE_IMG}/Wrist_Curl_With_Barbell/images/0.jpg`,
		youtubeUrl: null,
	},
];

async function seed() {
	console.log(`Seeding ${exercises.length} exercises…`);

	await db
		.insert(exerciseDictionary)
		.values(exercises)
		.onConflictDoNothing({ target: exerciseDictionary.name });

	console.log("Done.");
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
