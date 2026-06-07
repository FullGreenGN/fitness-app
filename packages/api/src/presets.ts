export const PRESETS = [
	{
		id: "ppl",
		name: "Push Pull Legs",
		description: "Classic 3-day split targeting all muscle groups",
		workouts: [
			{
				name: "Push Day",
				exercises: [
					{ name: "Barbell Bench Press", sets: 4, reps: 8 },
					{ name: "Overhead Press", sets: 3, reps: 10 },
					{ name: "Incline Dumbbell Press", sets: 3, reps: 10 },
					{ name: "Lateral Raise", sets: 3, reps: 15 },
					{ name: "Skull Crusher", sets: 3, reps: 12 },
					{ name: "Tricep Dips", sets: 3, reps: 12 },
				],
			},
			{
				name: "Pull Day",
				exercises: [
					{ name: "Pull-Up", sets: 4, reps: 8 },
					{ name: "Barbell Bent-Over Row", sets: 4, reps: 8 },
					{ name: "Lat Pulldown", sets: 3, reps: 10 },
					{ name: "Barbell Curl", sets: 3, reps: 12 },
					{ name: "Hammer Curl", sets: 3, reps: 12 },
				],
			},
			{
				name: "Leg Day",
				exercises: [
					{ name: "Barbell Squat", sets: 4, reps: 8 },
					{ name: "Romanian Deadlift", sets: 3, reps: 10 },
					{ name: "Leg Press", sets: 3, reps: 12 },
					{ name: "Leg Curl", sets: 3, reps: 12 },
					{ name: "Standing Calf Raise", sets: 4, reps: 15 },
				],
			},
		],
	},
	{
		id: "stronglifts",
		name: "5×5 Stronglifts",
		description: "Proven 2-day barbell strength program for beginners",
		workouts: [
			{
				name: "Workout A",
				exercises: [
					{ name: "Barbell Squat", sets: 5, reps: 5 },
					{ name: "Barbell Bench Press", sets: 5, reps: 5 },
					{ name: "Barbell Bent-Over Row", sets: 5, reps: 5 },
				],
			},
			{
				name: "Workout B",
				exercises: [
					{ name: "Barbell Squat", sets: 5, reps: 5 },
					{ name: "Overhead Press", sets: 5, reps: 5 },
					{ name: "Barbell Deadlift", sets: 1, reps: 5 },
				],
			},
		],
	},
	{
		id: "upper-lower",
		name: "Upper / Lower",
		description: "4-day split balancing strength and hypertrophy",
		workouts: [
			{
				name: "Upper A — Strength",
				exercises: [
					{ name: "Barbell Bench Press", sets: 4, reps: 5 },
					{ name: "Barbell Bent-Over Row", sets: 4, reps: 5 },
					{ name: "Overhead Press", sets: 3, reps: 8 },
					{ name: "Lat Pulldown", sets: 3, reps: 8 },
					{ name: "Barbell Curl", sets: 3, reps: 12 },
					{ name: "Skull Crusher", sets: 3, reps: 12 },
				],
			},
			{
				name: "Lower A — Strength",
				exercises: [
					{ name: "Barbell Squat", sets: 4, reps: 5 },
					{ name: "Romanian Deadlift", sets: 3, reps: 8 },
					{ name: "Leg Press", sets: 3, reps: 10 },
					{ name: "Standing Calf Raise", sets: 4, reps: 15 },
				],
			},
			{
				name: "Upper B — Hypertrophy",
				exercises: [
					{ name: "Incline Dumbbell Press", sets: 4, reps: 10 },
					{ name: "Pull-Up", sets: 4, reps: 10 },
					{ name: "Lateral Raise", sets: 3, reps: 15 },
					{ name: "Seated Cable Row", sets: 3, reps: 12 },
					{ name: "Hammer Curl", sets: 3, reps: 12 },
					{ name: "Tricep Dips", sets: 3, reps: 12 },
				],
			},
			{
				name: "Lower B — Hypertrophy",
				exercises: [
					{ name: "Romanian Deadlift", sets: 4, reps: 10 },
					{ name: "Leg Press", sets: 4, reps: 12 },
					{ name: "Barbell Lunge", sets: 3, reps: 10 },
					{ name: "Leg Curl", sets: 3, reps: 12 },
					{ name: "Standing Calf Raise", sets: 4, reps: 15 },
				],
			},
		],
	},
	{
		id: "fullbody",
		name: "Full Body 3×",
		description: "3-day full body for beginners and those with limited time",
		workouts: [
			{
				name: "Day A",
				exercises: [
					{ name: "Barbell Squat", sets: 3, reps: 8 },
					{ name: "Barbell Bench Press", sets: 3, reps: 8 },
					{ name: "Barbell Bent-Over Row", sets: 3, reps: 8 },
					{ name: "Overhead Press", sets: 2, reps: 10 },
					{ name: "Barbell Curl", sets: 2, reps: 12 },
					{ name: "Plank", sets: 3, reps: 30 },
				],
			},
			{
				name: "Day B",
				exercises: [
					{ name: "Barbell Deadlift", sets: 3, reps: 5 },
					{ name: "Pull-Up", sets: 3, reps: 8 },
					{ name: "Incline Dumbbell Press", sets: 3, reps: 10 },
					{ name: "Hip Thrust", sets: 3, reps: 12 },
					{ name: "Skull Crusher", sets: 2, reps: 12 },
					{ name: "Standing Calf Raise", sets: 3, reps: 15 },
				],
			},
			{
				name: "Day C",
				exercises: [
					{ name: "Barbell Squat", sets: 3, reps: 10 },
					{ name: "Lat Pulldown", sets: 3, reps: 10 },
					{ name: "Barbell Bench Press", sets: 3, reps: 10 },
					{ name: "Romanian Deadlift", sets: 3, reps: 10 },
					{ name: "Lateral Raise", sets: 3, reps: 15 },
					{ name: "Cable Crunch", sets: 3, reps: 15 },
				],
			},
		],
	},
] as const;

export type Preset = (typeof PRESETS)[number];
