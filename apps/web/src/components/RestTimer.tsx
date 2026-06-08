import { X } from "lucide-react";
import { useEffect } from "react";

import { useRestTimer } from "@/store/useRestTimer";

const ALERT_SOUND =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export function RestTimer() {
  const { timeLeft, isActive, stopTimer, tick } = useRestTimer();

  // Drive the countdown — interval is tied to isActive so it cleans up on stop
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, tick]);

  // On completion: play alert, auto-dismiss after 3 s
  useEffect(() => {
    if (!isActive || timeLeft > 0) return;
    new Audio(ALERT_SOUND).play().catch(() => {});
    const id = setTimeout(stopTimer, 3000);
    return () => clearTimeout(id);
  }, [timeLeft, isActive, stopTimer]);

  if (!isActive) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const formatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const isDone = timeLeft === 0;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 pointer-events-auto">
      <div
        className={`flex items-center gap-3 rounded-full border px-5 py-2.5 shadow-2xl backdrop-blur-md transition-all duration-300 ${
          isDone
            ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-300"
            : "border-border bg-background/95 text-foreground"
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isDone ? "Rest over" : "Rest"}
        </span>
        <span
          className={`font-mono text-xl font-bold tabular-nums leading-none ${
            isDone ? "text-emerald-300" : ""
          }`}
        >
          {isDone ? "Done!" : formatted}
        </span>
        <button
          type="button"
          onClick={stopTimer}
          aria-label="Skip rest timer"
          className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
