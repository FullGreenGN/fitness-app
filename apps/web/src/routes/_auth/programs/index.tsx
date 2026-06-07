import { Card, CardContent } from "@fitness-app/ui/components/card";
import { Skeleton } from "@fitness-app/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, ChevronRight, Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ProgramMuscleAnalysis,
  type ProgramWithMuscles,
} from "@/components/ProgramMuscleAnalysis";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/programs/")({ component: ProgramsPage });

function ProgramsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [muscleMapProgram, setMuscleMapProgram] = useState<ProgramWithMuscles | null>(null);

  const { data: programs, isPending } = useQuery(trpc.programs.getAll.queryOptions());

  const createMutation = useMutation(
    trpc.programs.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.programs.getAll.queryFilter());
        setName("");
        setShowCreate(false);
        toast.success("Program created");
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  const deleteMutation = useMutation(
    trpc.programs.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.programs.getAll.queryFilter());
        toast.success("Program deleted");
      },
      onError: (err) => { toast.error(err.message); },
    }),
  );

  useEffect(() => {
    if (muscleMapProgram) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [muscleMapProgram]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate({ name: trimmed });
  }

  return (
    <>
      <div className="space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow transition-transform active:scale-95"
          >
            {showCreate
              ? <X className="h-5 w-5" strokeWidth={2.5} />
              : <Plus className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Program name"
              maxLength={100}
              className="flex-1 rounded-xl border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring/60"
            />
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving…" : "Create"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {isPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[96px] w-full rounded-2xl" />
              ))
            : programs?.map((program) => (
                <Card key={program.id} className="overflow-hidden rounded-2xl ring-1 ring-border">
                  <CardContent className="p-0">
                    {/* Main row — navigates to the builder */}
                    <Link
                      to="/programs/$programId"
                      params={{ programId: program.id }}
                      className="flex items-center gap-3.5 px-4 py-4"
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{program.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {program.description ??
                            `${program.workouts.length} workout${program.workouts.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>

                    {/* Action row */}
                    <div className="flex items-stretch border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate({ id: program.id })}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1.5 border-r border-border/40 px-4 py-2.5 text-xs text-muted-foreground/50 transition-colors hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setMuscleMapProgram(program)}
                        className="flex flex-1 items-center justify-between px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground active:bg-muted/50"
                      >
                        <span className="flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-orange-400" />
                          View Muscle Map
                        </span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {!isPending && programs?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">No programs yet</p>
            <p className="text-xs text-muted-foreground/60">Tap + to create your first split</p>
          </div>
        )}
      </div>

      {/* Muscle map bottom sheet */}
      {muscleMapProgram && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
            onClick={() => setMuscleMapProgram(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[80dvh] flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl">
            <div className="flex shrink-0 flex-col items-center gap-3 px-4 pt-3 pb-4">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="flex w-full items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{muscleMapProgram.name}</p>
                  <p className="text-xs text-muted-foreground">Muscle coverage</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMuscleMapProgram(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-8">
              <ProgramMuscleAnalysis program={muscleMapProgram} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
