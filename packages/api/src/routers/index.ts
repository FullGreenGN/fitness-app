import { publicProcedure, protectedProcedure, router } from "../index";

import { exerciseDictionaryRouter } from "./exercise_dictionary";
import { liveWorkoutRouter } from "./liveWorkout";
import { programsRouter } from "./programs";

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
});

export type AppRouter = typeof appRouter;
