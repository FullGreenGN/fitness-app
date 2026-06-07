import { publicProcedure, protectedProcedure, router } from "../index";

import { exerciseDictionaryRouter } from "./exercise_dictionary";
import { liveWorkoutRouter } from "./liveWorkout";
import { nutritionRouter } from "./nutrition";
import { programsRouter } from "./programs";
import { statsRouter } from "./stats";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  programs: programsRouter,
  liveWorkout: liveWorkoutRouter,
  exerciseDictionary: exerciseDictionaryRouter,
  stats: statsRouter,
  nutrition: nutritionRouter,
});

export type AppRouter = typeof appRouter;
