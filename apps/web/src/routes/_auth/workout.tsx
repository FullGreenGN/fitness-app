import { Button } from "@fitness-app/ui/components/button";
import { Input } from "@fitness-app/ui/components/input";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Dumbbell, Flame, Plus, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AddExerciseModal } from "@/components/AddExerciseModal";
import { queryClient, trpc } from "@/utils/trpc";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_auth/workout")({
  validateSearch: z.object({ workoutId: z.string().optional() }),
  component: WorkoutPage,
});

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Page shell ───────────────────────────────────────────────────────────────

function getFinishedWorkouts(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem("finishedWorkouts") ?? "[]"));
  } catch {
    return new Set();
  }
}

function markWorkoutFinished(workoutId: string) {
  try {
    const ids = Array.from(getFinishedWorkouts());
    ids.push(workoutId);
    // Keep only the last 50 to avoid unbounded growth
    localStorage.setItem("finishedWorkouts", JSON.stringify(ids.slice(-50)));
  } catch {}
}

function WorkoutPage() {
  const { workoutId } = Route.useSearch();
  const navigate = useNavigate();

  const { data: current, isPending: currentPending } = useQuery(
    trpc.liveWorkout.currentWorkout.queryOptions(),
  );

  // Auto-resume: redirect to the active workout if none is selected
  useEffect(() => {
    if (workoutId) return;
    if (!current) return;
    if (getFinishedWorkouts().has(current.workoutId)) return;
    navigate({ to: "/workout", search: { workoutId: current.workoutId }, replace: true });
  }, [workoutId, current, navigate]);

  if (!workoutId) {
    if (currentPending) {
      return (
        <div className="space-y-4 p-4">
          <Skeleton className="h-[72px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-8 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">No workout selected</p>
          <p className="text-sm text-muted-foreground">
            Choose a workout from your programs to get started.
          </p>
        </div>
        <Link
          to="/programs"
          className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Browse Programs
        </Link>
      </div>
    );
  }

  return <WorkoutSession workoutId={workoutId} />;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSet {
  weight: string;
  reps: string;
}

// ─── Session component (always has a workoutId) ───────────────────────────────

function WorkoutSession({ workoutId }: { workoutId: string }) {
  const navigate = useNavigate();
  const { data: workout, isPending } = useQuery(
    trpc.liveWorkout.getWorkout.queryOptions({ workoutId }),
  );

  const [pending, setPending] = useState<Record<string, PendingSet[]>>({});
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  // Seed pending sets on load: fill up to targetSets, at least 1
  useEffect(() => {
    if (!workout) return;
    setPending(
      Object.fromEntries(
        workout.exercises.map((ex) => {
          const remaining = Math.max(1, ex.targetSets - ex.sets.length);
          return [ex.id, Array.from({ length: remaining }, () => ({ weight: "", reps: "" }))];
        }),
      ),
    );
  }, [workout?.id]);

  const logSetMutation = useMutation(
    trpc.liveWorkout.logSet.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.liveWorkout.getWorkout.queryFilter({ workoutId }));
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  const removeSetMutation = useMutation(
    trpc.liveWorkout.removeSet.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.liveWorkout.getWorkout.queryFilter({ workoutId }));
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  const elapsed = useTimer();

  if (isPending) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-[72px] w-full rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
        <p className="font-semibold">Workout not found</p>
        <Link to="/programs" className="text-sm text-muted-foreground underline underline-offset-2">
          Back to Programs
        </Link>
      </div>
    );
  }

  const loggedSetsTotal = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const pendingSetsTotal = Object.values(pending).reduce((sum, arr) => sum + arr.length, 0);
  const total = loggedSetsTotal + pendingSetsTotal;
  const progress = total > 0 ? (loggedSetsTotal / total) * 100 : 0;

  function handleLogSet(exerciseId: string, idx: number) {
    const set = pending[exerciseId]?.[idx];
    if (!set) return;
    const weight = parseFloat(set.weight);
    const reps = parseInt(set.reps, 10);
    if (Number.isNaN(weight) || Number.isNaN(reps) || reps < 1 || weight < 0) return;

    logSetMutation.mutate(
      { exerciseId, weight, reps, isWarmup: false },
      {
        onSuccess: () => {
          setPending((prev) => {
            const arr = (prev[exerciseId] ?? []).filter((_, i) => i !== idx);
            return { ...prev, [exerciseId]: arr };
          });
        },
      },
    );
  }

  function handleAddPending(exerciseId: string) {
    setPending((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), { weight: "", reps: "" }],
    }));
  }

  function handleUpdatePending(exerciseId: string, idx: number, field: "weight" | "reps", value: string) {
    setPending((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).map((s, i) =>
        i === idx ? { ...s, [field]: value } : s,
      ),
    }));
  }

  function handleRemovePending(exerciseId: string, idx: number) {
    setPending((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).filter((_, i) => i !== idx),
    }));
  }

  return (
    <div className="min-h-full bg-background">
      {/* Sticky session header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">{workout.name}</h1>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="font-mono text-xl font-semibold tabular-nums">{elapsed}</span>
              <span className="text-xs text-muted-foreground">
                {loggedSetsTotal} sets logged
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-0.5 rounded-full px-4 text-xs font-semibold"
            onClick={() => setShowFinish(true)}
          >
            <Flame className="mr-1 h-3.5 w-3.5" />
            Finish
          </Button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 p-4">
        {workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            pendingSets={pending[exercise.id] ?? []}
            onLogSet={(idx) => handleLogSet(exercise.id, idx)}
            onRemoveLoggedSet={(setId) => removeSetMutation.mutate({ setId })}
            onAddPending={() => handleAddPending(exercise.id)}
            onUpdatePending={(idx, field, value) => handleUpdatePending(exercise.id, idx, field, value)}
            onRemovePending={(idx) => handleRemovePending(exercise.id, idx)}
            isLogging={logSetMutation.isPending}
            isRemoving={removeSetMutation.isPending}
          />
        ))}

        <button
          type="button"
          onClick={() => setAddExerciseOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>
      </div>

      <AddExerciseModal
        workoutId={workoutId}
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
      />

      {/* ── Finish confirmation sheet ──────────────────────────────────────── */}
      {showFinish && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
            onClick={() => setShowFinish(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl border-t border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-bold">Finish Workout?</p>
              <button
                type="button"
                onClick={() => setShowFinish(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-muted py-4">
                <span className="text-2xl font-bold tabular-nums">{loggedSetsTotal}</span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">Sets</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-muted py-4">
                <span className="text-2xl font-bold tabular-nums">
                  {workout.exercises.filter((ex) => ex.sets.length > 0).length}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">Exercises</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-muted py-4">
                <span className="text-2xl font-bold tabular-nums">{elapsed}</span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">Time</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                markWorkoutFinished(workoutId);
                navigate({ to: "/" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
            >
              <Trophy className="h-4 w-4" />
              Finish Workout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

interface DbSet {
  id: string;
  weight: number;
  reps: number;
}

interface DbExercise {
  id: string;
  targetSets: number;
  targetReps: number;
  dictionary: {
    name: string;
    imageUrl: string | null;
  };
  sets: DbSet[];
}

interface ExerciseCardProps {
  exercise: DbExercise;
  pendingSets: PendingSet[];
  onLogSet: (idx: number) => void;
  onRemoveLoggedSet: (setId: string) => void;
  onAddPending: () => void;
  onUpdatePending: (idx: number, field: "weight" | "reps", value: string) => void;
  onRemovePending: (idx: number) => void;
  isLogging: boolean;
  isRemoving: boolean;
}

function ExerciseCard({
  exercise,
  pendingSets,
  onLogSet,
  onRemoveLoggedSet,
  onAddPending,
  onUpdatePending,
  onRemovePending,
  isLogging,
  isRemoving,
}: ExerciseCardProps) {
  const loggedCount = exercise.sets.length;
  const totalSets = loggedCount + pendingSets.length;
  const allDone = loggedCount === totalSets && totalSets > 0;

  return (
    <div className={`overflow-hidden rounded-2xl border transition-colors ${allDone ? "border-foreground/20" : "border-border"} bg-card`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold">{exercise.dictionary.name}</h2>
        <span className="text-xs text-muted-foreground">{loggedCount}/{totalSets}</span>
      </div>

      <div className="grid grid-cols-[2rem_1fr_1fr_3rem_2rem] items-center gap-2 border-b border-border/40 px-4 py-1.5">
        {["Set", "kg", "Reps", "Done", ""].map((h) => (
          <span key={h} className="text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-border/30">
        {/* Already-logged sets (from DB) */}
        {exercise.sets.map((s, idx) => (
          <LoggedSetRow
            key={s.id}
            set={s}
            index={idx + 1}
            onRemove={() => onRemoveLoggedSet(s.id)}
            isRemoving={isRemoving}
          />
        ))}

        {/* Pending sets (local state, not yet logged) */}
        {pendingSets.map((s, idx) => (
          <PendingSetRow
            key={`pending-${idx}`}
            set={s}
            index={loggedCount + idx + 1}
            onUpdate={(field, value) => onUpdatePending(idx, field, value)}
            onLog={() => onLogSet(idx)}
            onRemove={() => onRemovePending(idx)}
            isLogging={isLogging}
            canRemove={pendingSets.length > 1 || loggedCount > 0}
          />
        ))}
      </div>

      <div className="p-3 pt-2">
        <button
          type="button"
          onClick={onAddPending}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground active:scale-[0.99]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Set
        </button>
      </div>
    </div>
  );
}

// ─── LoggedSetRow (completed / from DB) ──────────────────────────────────────

interface LoggedSetRowProps {
  set: DbSet;
  index: number;
  onRemove: () => void;
  isRemoving: boolean;
}

function LoggedSetRow({ set, index, onRemove, isRemoving }: LoggedSetRowProps) {
  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_3rem_2rem] items-center gap-2 bg-foreground/5 px-4 py-2">
      <span className="text-center text-sm font-bold tabular-nums text-foreground/40">{index}</span>
      <span className="flex h-10 items-center justify-center text-sm font-semibold opacity-50">
        {set.weight}
      </span>
      <span className="flex h-10 items-center justify-center text-sm font-semibold opacity-50">
        {set.reps}
      </span>
      <div className="flex justify-center">
        <div className="flex size-7 items-center justify-center rounded-full border-2 border-foreground bg-foreground">
          <Check className="h-3.5 w-3.5 text-background" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="text-muted-foreground/40 transition-colors hover:text-destructive active:scale-90 disabled:opacity-30"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── PendingSetRow (local state, not yet logged) ──────────────────────────────

interface PendingSetRowProps {
  set: PendingSet;
  index: number;
  onUpdate: (field: "weight" | "reps", value: string) => void;
  onLog: () => void;
  onRemove: () => void;
  isLogging: boolean;
  canRemove: boolean;
}

function PendingSetRow({ set, index, onUpdate, onLog, onRemove, isLogging, canRemove }: PendingSetRowProps) {
  const weight = parseFloat(set.weight);
  const reps = parseInt(set.reps, 10);
  const isValid = !Number.isNaN(weight) && !Number.isNaN(reps) && weight >= 0 && reps >= 1;

  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_3rem_2rem] items-center gap-2 px-4 py-2">
      <span className="text-center text-sm font-bold tabular-nums text-muted-foreground">{index}</span>
      <Input
        value={set.weight}
        onChange={(e) => onUpdate("weight", e.target.value)}
        inputMode="decimal"
        placeholder="—"
        className="h-10 rounded-xl border-0 bg-input/40 text-center text-sm font-semibold focus-visible:ring-1 focus-visible:ring-ring/60"
      />
      <Input
        value={set.reps}
        onChange={(e) => onUpdate("reps", e.target.value)}
        inputMode="numeric"
        placeholder="—"
        className="h-10 rounded-xl border-0 bg-input/40 text-center text-sm font-semibold focus-visible:ring-1 focus-visible:ring-ring/60"
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onLog}
          disabled={!isValid || isLogging}
          className={`flex size-7 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-30 ${
            isValid
              ? "border-foreground/70 text-foreground/70 hover:border-foreground hover:text-foreground"
              : "border-border text-muted-foreground/30"
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex justify-center">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground/40 transition-colors hover:text-destructive active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
