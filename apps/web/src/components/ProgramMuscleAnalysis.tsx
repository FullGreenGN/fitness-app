import Model from "react-body-highlighter";
import type { IExerciseData, Muscle } from "react-body-highlighter";

// ─── Public interface (used by programs page for state typing) ────────────────

export interface ProgramWithMuscles {
  id: string;
  name: string;
  workouts: Array<{
    exercises: Array<{
      dictionary: {
        name: string;
        targetMuscle: string | null;
      } | null;
    }>;
  }>;
}

// ─── Muscle name normalisation ────────────────────────────────────────────────

const MUSCLE_MAP: Record<string, Muscle> = {
  // Chest
  chest: "chest",
  pectorals: "chest",
  pecs: "chest",
  pec: "chest",

  // Arms
  biceps: "biceps",
  bicep: "biceps",
  triceps: "triceps",
  tricep: "triceps",
  forearm: "forearm",
  forearms: "forearm",

  // Shoulders
  shoulders: "front-deltoids",
  shoulder: "front-deltoids",
  deltoids: "front-deltoids",
  delts: "front-deltoids",
  delt: "front-deltoids",
  "front deltoids": "front-deltoids",
  "front deltoid": "front-deltoids",
  "front delt": "front-deltoids",
  "anterior deltoid": "front-deltoids",
  "rear deltoids": "back-deltoids",
  "rear deltoid": "back-deltoids",
  "rear delt": "back-deltoids",
  "back deltoids": "back-deltoids",
  "back deltoid": "back-deltoids",
  "posterior deltoid": "back-deltoids",

  // Back
  back: "upper-back",
  lats: "upper-back",
  lat: "upper-back",
  latissimus: "upper-back",
  "upper back": "upper-back",
  "upper-back": "upper-back",
  traps: "trapezius",
  trapezius: "trapezius",
  "lower back": "lower-back",
  "lower-back": "lower-back",
  "erectors": "lower-back",

  // Core
  abs: "abs",
  abdominals: "abs",
  core: "abs",
  obliques: "obliques",
  oblique: "obliques",

  // Legs
  quads: "quadriceps",
  quadriceps: "quadriceps",
  quad: "quadriceps",
  hamstrings: "hamstring",
  hamstring: "hamstring",
  hams: "hamstring",
  glutes: "gluteal",
  glute: "gluteal",
  gluteus: "gluteal",
  gluteal: "gluteal",
  calves: "calves",
  calf: "calves",
  adductors: "adductor",
  adductor: "adductor",
  "inner thigh": "adductor",
  abductors: "abductors",
  abductor: "abductors",
  "outer thigh": "abductors",

  // Other
  neck: "neck",
  head: "head",
};

function toMuscle(raw: string | null): Muscle | null {
  if (!raw) return null;
  return MUSCLE_MAP[raw.toLowerCase().trim()] ?? null;
}

// ─── Data extractor ───────────────────────────────────────────────────────────

function buildExerciseData(program: ProgramWithMuscles): IExerciseData[] {
  const data: IExerciseData[] = [];

  for (const workout of program.workouts) {
    for (const exercise of workout.exercises) {
      const muscle = toMuscle(exercise.dictionary?.targetMuscle ?? null);
      if (!muscle) continue;
      data.push({ name: exercise.dictionary?.name ?? "Exercise", muscles: [muscle] });
    }
  }

  return data;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  program: ProgramWithMuscles;
}

export function ProgramMuscleAnalysis({ program }: Props) {
  const data = buildExerciseData(program);

  const uniqueMuscles = [...new Set(data.flatMap((d) => d.muscles))];

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-muted px-4 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No muscle data yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Add a target muscle to each exercise to see the map.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Model grid */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-zinc-900 p-3 dark:bg-zinc-950">
        <div className="space-y-1">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Front
          </p>
          <Model
            type="anterior"
            data={data}
            bodyColor="#3f4552"
            highlightedColors={["#f97316", "#ea580c"]}
            style={{ width: "100%" }}
            svgStyle={{ width: "100%", height: "auto" }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Back
          </p>
          <Model
            type="posterior"
            data={data}
            bodyColor="#3f4552"
            highlightedColors={["#f97316", "#ea580c"]}
            style={{ width: "100%" }}
            svgStyle={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>

      {/* Muscle tag list */}
      {uniqueMuscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {uniqueMuscles.map((m) => (
            <span
              key={m}
              className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-medium capitalize text-orange-400"
            >
              {m.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
