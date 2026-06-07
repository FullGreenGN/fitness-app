import { Input } from "@fitness-app/ui/components/input";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, ChevronLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/history")({
  validateSearch: z.object({
    workoutId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  component: HistoryDetailPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSet {
  weight: string;
  reps: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function HistoryDetailPage() {
  const { workoutId, date } = Route.useSearch();

  const { data, isPending } = useQuery(
    trpc.stats.getSessionDetail.queryOptions({ workoutId, date }),
  );

  function invalidate() {
    queryClient.invalidateQueries(
      trpc.stats.getSessionDetail.queryFilter({ workoutId, date }),
    );
    // Keep the dashboard history list + volume chart in sync
    queryClient.invalidateQueries(trpc.stats.workoutHistory.queryFilter());
    queryClient.invalidateQueries(trpc.stats.volumeByDay.queryFilter());
  }

  const updateSet = useMutation(
    trpc.liveWorkout.updateSet.mutationOptions({
      onSuccess: invalidate,
      onError: (err) => toast.error(err.message),
    }),
  );

  const removeSet = useMutation(
    trpc.liveWorkout.removeSet.mutationOptions({
      onSuccess: invalidate,
      onError: (err) => toast.error(err.message),
    }),
  );

  const addSet = useMutation(
    trpc.liveWorkout.addHistoricalSet.mutationOptions({
      onSuccess: invalidate,
      onError: (err) => toast.error(err.message),
    }),
  );

  // Only one set can be in edit mode at a time
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ weight: "", reps: "" });

  // Pending (new) sets keyed by exerciseId
  const [pendingByExercise, setPendingByExercise] = useState<
    Record<string, PendingSet[]>
  >({});

  function startEdit(set: { id: string; weight: number; reps: number }) {
    setEditingSetId(set.id);
    setEditValues({ weight: String(set.weight), reps: String(set.reps) });
  }

  function saveEdit(setId: string) {
    const weight = parseFloat(editValues.weight);
    const reps = parseInt(editValues.reps, 10);
    if (isNaN(weight) || isNaN(reps) || weight < 0 || reps < 1) return;
    updateSet.mutate({ setId, weight, reps }, { onSuccess: () => setEditingSetId(null) });
  }

  function addPending(exerciseId: string) {
    setPendingByExercise((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), { weight: "", reps: "" }],
    }));
  }

  function updatePending(exerciseId: string, idx: number, field: "weight" | "reps", value: string) {
    setPendingByExercise((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).map((s, i) =>
        i === idx ? { ...s, [field]: value } : s,
      ),
    }));
  }

  function removePending(exerciseId: string, idx: number) {
    setPendingByExercise((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] ?? []).filter((_, i) => i !== idx),
    }));
  }

  function logPending(exerciseId: string, idx: number) {
    const s = pendingByExercise[exerciseId]?.[idx];
    if (!s) return;
    const weight = parseFloat(s.weight);
    const reps = parseInt(s.reps, 10);
    if (isNaN(weight) || isNaN(reps) || weight < 0 || reps < 1) return;
    addSet.mutate(
      { exerciseId, weight, reps, date },
      {
        onSuccess: () =>
          setPendingByExercise((prev) => ({
            ...prev,
            [exerciseId]: (prev[exerciseId] ?? []).filter((_, i) => i !== idx),
          })),
      },
    );
  }

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalSets = data?.exercises.reduce((n, ex) => n + ex.sets.length, 0) ?? 0;
  const totalVolume = data?.exercises.reduce(
    (n, ex) => n + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  ) ?? 0;

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-tight">
              {isPending ? "…" : (data?.workoutName ?? "Session")}
            </h1>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        {/* Stats strip */}
        {!isPending && data && (
          <div className="flex gap-5 px-4 pb-3">
            {[
              { label: "Sets", value: totalSets },
              { label: "Exercises", value: data.exercises.length },
              {
                label: "Volume",
                value: `${Math.round(totalVolume).toLocaleString()} kg`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold tabular-nums">{value}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-4 p-4 pb-24">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
          ))
        ) : !data?.exercises.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No sets found for this session.
            </p>
          </div>
        ) : (
          data.exercises.map((exercise) => {
            const pending = pendingByExercise[exercise.id] ?? [];
            return (
              <div
                key={exercise.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {/* Exercise header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h2 className="text-sm font-bold">{exercise.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Column labels */}
                <div className="grid grid-cols-[2rem_1fr_1fr_5rem] items-center gap-2 border-b border-border/40 px-4 py-1.5">
                  {["#", "kg", "Reps", ""].map((h) => (
                    <span
                      key={h}
                      className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-border/30">
                  {/* ── Logged sets ───────────────────────────────── */}
                  {exercise.sets.map((set, idx) =>
                    editingSetId === set.id ? (
                      /* Edit mode */
                      <div
                        key={set.id}
                        className="grid grid-cols-[2rem_1fr_1fr_5rem] items-center gap-2 bg-orange-500/5 px-4 py-2"
                      >
                        <span className="text-center text-sm font-bold tabular-nums text-muted-foreground">
                          {idx + 1}
                        </span>
                        <Input
                          autoFocus
                          value={editValues.weight}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, weight: e.target.value }))
                          }
                          inputMode="decimal"
                          className="h-9 rounded-xl border-orange-500/30 bg-background text-center text-sm font-semibold focus-visible:ring-orange-500/40"
                        />
                        <Input
                          value={editValues.reps}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, reps: e.target.value }))
                          }
                          inputMode="numeric"
                          className="h-9 rounded-xl border-orange-500/30 bg-background text-center text-sm font-semibold focus-visible:ring-orange-500/40"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(set.id)}
                            disabled={updateSet.isPending}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm shadow-orange-500/30 transition-transform active:scale-95 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSetId(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div
                        key={set.id}
                        className="grid grid-cols-[2rem_1fr_1fr_5rem] items-center gap-2 px-4 py-2.5"
                      >
                        <span className="text-center text-sm font-bold tabular-nums text-foreground/30">
                          {idx + 1}
                        </span>
                        <span className="text-center text-sm font-semibold tabular-nums">
                          {set.weight}
                        </span>
                        <span className="text-center text-sm font-semibold tabular-nums">
                          {set.reps}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(set)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSet.mutate({ setId: set.id })}
                            disabled={removeSet.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}

                  {/* ── Pending new sets ──────────────────────────── */}
                  {pending.map((s, idx) => {
                    const w = parseFloat(s.weight);
                    const r = parseInt(s.reps, 10);
                    const isValid = !isNaN(w) && !isNaN(r) && w >= 0 && r >= 1;
                    return (
                      <div
                        key={`pending-${idx}`}
                        className="grid grid-cols-[2rem_1fr_1fr_5rem] items-center gap-2 px-4 py-2"
                      >
                        <span className="text-center text-sm font-bold tabular-nums text-muted-foreground">
                          {exercise.sets.length + idx + 1}
                        </span>
                        <Input
                          value={s.weight}
                          onChange={(e) =>
                            updatePending(exercise.id, idx, "weight", e.target.value)
                          }
                          inputMode="decimal"
                          placeholder="—"
                          className="h-9 rounded-xl border-0 bg-input/40 text-center text-sm font-semibold"
                        />
                        <Input
                          value={s.reps}
                          onChange={(e) =>
                            updatePending(exercise.id, idx, "reps", e.target.value)
                          }
                          inputMode="numeric"
                          placeholder="—"
                          className="h-9 rounded-xl border-0 bg-input/40 text-center text-sm font-semibold"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => logPending(exercise.id, idx)}
                            disabled={!isValid || addSet.isPending}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-30 ${
                              isValid
                                ? "border-foreground/70 text-foreground/70 hover:border-foreground"
                                : "border-border text-muted-foreground/30"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePending(exercise.id, idx)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Set */}
                <div className="p-3 pt-2">
                  <button
                    type="button"
                    onClick={() => addPending(exercise.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground active:scale-[0.99]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Set
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
