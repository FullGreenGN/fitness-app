import { Card, CardContent } from "@fitness-app/ui/components/card";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Dumbbell, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AddExerciseModal } from "@/components/AddExerciseModal";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/programs/$programId")({
  component: ProgramBuilderPage,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProgramBuilderPage() {
  const { programId } = Route.useParams();

  const { data: program, isPending } = useQuery(
    trpc.programs.getOne.queryOptions({ id: programId }),
  );

  const [addExerciseWorkoutId, setAddExerciseWorkoutId] = useState<string | null>(null);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState("");

  const createWorkoutMutation = useMutation(
    trpc.programs.createWorkout.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.programs.getOne.queryFilter({ id: programId }));
        setWorkoutName("");
        setShowCreateWorkout(false);
        toast.success("Workout day created");
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  function handleCreateWorkout(e: React.FormEvent) {
    e.preventDefault();
    const name = workoutName.trim();
    if (!name) return;
    createWorkoutMutation.mutate({ programId, name });
  }

  return (
    <div className="min-h-full bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            to="/programs"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            {isPending ? (
              <Skeleton className="h-5 w-40 rounded-lg" />
            ) : (
              <h1 className="truncate text-lg font-bold leading-tight">
                {program?.name ?? "Program"}
              </h1>
            )}
            <p className="text-xs text-muted-foreground">Program Builder</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4 pb-24">
        {isPending ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))
        ) : !program ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-semibold text-muted-foreground">Program not found</p>
            <Link to="/programs" className="mt-2 block text-xs text-muted-foreground/60 underline underline-offset-2">
              Back to Programs
            </Link>
          </div>
        ) : program.workouts.length === 0 && !showCreateWorkout ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">No workout days yet</p>
            <p className="text-xs text-muted-foreground/60">Tap "Add Workout Day" below to start building</p>
          </div>
        ) : (
          program.workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onAddExercise={() => setAddExerciseWorkoutId(workout.id)}
            />
          ))
        )}

        {/* Create workout form / button */}
        {showCreateWorkout ? (
          <form
            onSubmit={handleCreateWorkout}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">New Workout Day</p>
              <button
                type="button"
                onClick={() => { setShowCreateWorkout(false); setWorkoutName(""); }}
                className="text-muted-foreground/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <input
                autoFocus
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g. Push Day, Pull Day, Leg Day…"
                maxLength={200}
                className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
              />
              <button
                type="submit"
                disabled={!workoutName.trim() || createWorkoutMutation.isPending}
                className="w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-50"
              >
                {createWorkoutMutation.isPending ? "Creating…" : "Create Workout Day"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateWorkout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Add Workout Day
          </button>
        )}
      </div>

      {/* Add Exercise modal — workoutId changes per workout card */}
      <AddExerciseModal
        workoutId={addExerciseWorkoutId ?? ""}
        open={!!addExerciseWorkoutId}
        onClose={() => setAddExerciseWorkoutId(null)}
        onSuccess={() =>
          queryClient.invalidateQueries(trpc.programs.getOne.queryFilter({ id: programId }))
        }
      />
    </div>
  );
}

// ─── Workout card ─────────────────────────────────────────────────────────────

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    notes: string | null;
    exercises: Array<{
      id: string;
      targetSets: number;
      targetReps: number;
      dictionary: {
        name: string;
        targetMuscle: string | null;
        imageUrl: string | null;
      } | null;
    }>;
  };
  onAddExercise: () => void;
}

function WorkoutCard({ workout, onAddExercise }: WorkoutCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl ring-1 ring-border">
      <CardContent className="p-0">
        {/* Workout header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold">{workout.name}</p>
            {workout.notes && (
              <p className="mt-0.5 text-xs text-muted-foreground">{workout.notes}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {workout.exercises.length} exercise{workout.exercises.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Exercise rows */}
        {workout.exercises.length > 0 && (
          <div className="divide-y divide-border/40">
            {workout.exercises.map((exercise, idx) => (
              <div key={exercise.id} className="flex items-center gap-3 px-4 py-3">
                {/* Thumbnail or placeholder */}
                {exercise.dictionary?.imageUrl ? (
                  <img
                    src={exercise.dictionary.imageUrl}
                    alt={exercise.dictionary.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {exercise.dictionary?.name ?? "Unknown exercise"}
                  </p>
                  {exercise.dictionary?.targetMuscle && (
                    <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                      {exercise.dictionary.targetMuscle}
                    </p>
                  )}
                </div>

                {/* Target sets × reps badge */}
                <div className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-center">
                  <span className="text-xs font-bold tabular-nums">
                    {exercise.targetSets}
                  </span>
                  <span className="text-[10px] text-muted-foreground"> × </span>
                  <span className="text-xs font-bold tabular-nums">
                    {exercise.targetReps}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add exercise button */}
        <div className="border-t border-border/40 p-3">
          <button
            type="button"
            onClick={onAddExercise}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground active:scale-[0.99]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Exercise
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
