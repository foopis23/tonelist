import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
	users: userRouter
});

export type AppRouter = typeof appRouter;