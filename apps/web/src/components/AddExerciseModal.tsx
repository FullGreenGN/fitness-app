import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Dumbbell, ImagePlus, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { queryClient, trpc } from "@/utils/trpc";
import { uploadExerciseImage } from "@/utils/upload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  workoutId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DictEntry = {
  id: string;
  name: string;
  targetMuscle: string | null;
  imageUrl: string | null;
};

// ─── Shared sets/reps input ───────────────────────────────────────────────────

interface SetsRepsProps {
  sets: string;
  reps: string;
  onSetsChange: (v: string) => void;
  onRepsChange: (v: string) => void;
}

function SetsRepsFields({ sets, reps, onSetsChange, onRepsChange }: SetsRepsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Target Sets
        </label>
        <input
          value={sets}
          onChange={(e) => onSetsChange(e.target.value)}
          inputMode="numeric"
          min={1}
          max={20}
          placeholder="3"
          className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-center text-sm font-bold outline-none focus:ring-1 focus:ring-ring/60"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Target Reps
        </label>
        <input
          value={reps}
          onChange={(e) => onRepsChange(e.target.value)}
          inputMode="numeric"
          min={1}
          max={100}
          placeholder="10"
          className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-center text-sm font-bold outline-none focus:ring-1 focus:ring-ring/60"
        />
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

export function AddExerciseModal({ workoutId, open, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<"search" | "create">("search");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="shrink-0 space-y-3 px-4 pt-3 pb-4">
          <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" />

          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Add Exercise</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0 rounded-xl bg-muted p-1">
            {(["search", "create"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  tab === t
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "search" ? "Search Database" : "Create New"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {tab === "search" ? (
            <SearchTab workoutId={workoutId} onClose={onClose} onSuccess={onSuccess} />
          ) : (
            <CreateTab workoutId={workoutId} onClose={onClose} onSuccess={onSuccess} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Search tab ───────────────────────────────────────────────────────────────

function SearchTab({
  workoutId,
  onClose,
  onSuccess,
}: {
  workoutId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When user picks a result, show the sets/reps confirmation panel
  const [selected, setSelected] = useState<DictEntry | null>(null);
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("10");

  function handleInput(value: string) {
    setInput(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setQuery(value), 300);
  }

  function handleSelect(entry: DictEntry) {
    setSelected(entry);
    setTargetSets("3");
    setTargetReps("10");
  }

  const { data: results, isFetching } = useQuery({
    ...trpc.exerciseDictionary.search.queryOptions({ query }),
    placeholderData: (prev) => prev,
  });

  const addMutation = useMutation(
    trpc.exerciseDictionary.addExerciseToWorkout.mutationOptions({
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        } else {
          queryClient.invalidateQueries(trpc.liveWorkout.getWorkout.queryFilter({ workoutId }));
        }
        toast.success("Exercise added");
        onClose();
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  function handleAdd() {
    if (!selected) return;
    const sets = parseInt(targetSets, 10);
    const reps = parseInt(targetReps, 10);
    if (isNaN(sets) || isNaN(reps) || sets < 1 || reps < 1) {
      toast.error("Enter valid sets and reps");
      return;
    }
    addMutation.mutate({ workoutId, dictionaryId: selected.id, targetSets: sets, targetReps: reps });
  }

  // Confirmation panel when an exercise is selected
  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </button>

        {/* Selected exercise card */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
          {selected.imageUrl ? (
            <img
              src={selected.imageUrl}
              alt={selected.name}
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{selected.name}</p>
            {selected.targetMuscle && (
              <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                {selected.targetMuscle}
              </p>
            )}
          </div>
        </div>

        <SetsRepsFields
          sets={targetSets}
          reps={targetReps}
          onSetsChange={setTargetSets}
          onRepsChange={setTargetReps}
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={addMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
        >
          {addMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.5} />
          )}
          {addMutation.isPending ? "Adding…" : "Add to Workout"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search exercises…"
          className="w-full rounded-xl border border-border bg-input/60 py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-1 focus:ring-ring/60"
        />
        {isFetching && (
          <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      {results && results.length > 0 ? (
        <ul className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border">
          {results.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => handleSelect(entry)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
              >
                {entry.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt={entry.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.name}</p>
                  {entry.targetMuscle && (
                    <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                      {entry.targetMuscle}
                    </p>
                  )}
                </div>
                <ChevronRightIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : results && results.length === 0 && query ? (
        <div className="rounded-2xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">No exercises found for "{query}"</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Try the "Create New" tab</p>
        </div>
      ) : null}
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-muted-foreground/50">
      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Create tab ───────────────────────────────────────────────────────────────

function CreateTab({
  workoutId,
  onClose,
  onSuccess,
}: {
  workoutId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("10");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addMutation = useMutation(
    trpc.exerciseDictionary.addExerciseToWorkout.mutationOptions({
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        } else {
          queryClient.invalidateQueries(trpc.liveWorkout.getWorkout.queryFilter({ workoutId }));
        }
        toast.success("Exercise created and added");
        onClose();
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  const createMutation = useMutation(
    trpc.exerciseDictionary.createGlobal.mutationOptions({
      onSuccess: (entry) => {
        const sets = parseInt(targetSets, 10);
        const reps = parseInt(targetReps, 10);
        addMutation.mutate({
          workoutId,
          dictionaryId: entry.id,
          targetSets: isNaN(sets) ? 3 : sets,
          targetReps: isNaN(reps) ? 10 : reps,
        });
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    let imageUrl: string | undefined;

    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadExerciseImage(imageFile);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Image upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createMutation.mutate({
      name: trimmedName,
      targetMuscle: muscle.trim() || undefined,
      imageUrl,
      youtubeUrl: youtubeUrl.trim() || undefined,
    });
  }

  const isBusy = uploading || createMutation.isPending || addMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exercise Name *
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Barbell Bench Press"
          maxLength={200}
          required
          className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
        />
      </div>

      {/* Target muscle */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Target Muscle
        </label>
        <input
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
          placeholder="e.g. Chest, Biceps, Quads…"
          maxLength={100}
          className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
        />
      </div>

      {/* Sets × Reps */}
      <SetsRepsFields
        sets={targetSets}
        reps={targetReps}
        onSetsChange={setTargetSets}
        onRepsChange={setTargetReps}
      />

      {/* Image upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exercise Image
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 transition-colors hover:border-foreground/40 hover:bg-muted/20 active:bg-muted/40"
        >
          <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-muted-foreground">
            {imageFile ? imageFile.name : "Tap to choose photo"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* YouTube URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          YouTube URL
        </label>
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          type="url"
          className="w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring/60"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || isBusy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
        {uploading ? "Uploading image…" : isBusy ? "Adding…" : "Create & Add Exercise"}
      </button>
    </form>
  );
}
