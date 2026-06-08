import { create } from "zustand";

interface RestTimerState {
  timeLeft: number;
  isActive: boolean;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tick: () => void;
}

export const useRestTimer = create<RestTimerState>((set) => ({
  timeLeft: 0,
  isActive: false,
  startTimer: (seconds) => set({ timeLeft: seconds, isActive: true }),
  stopTimer: () => set({ timeLeft: 0, isActive: false }),
  tick: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
}));
