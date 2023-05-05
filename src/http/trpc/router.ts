import { commandRouter } from "./routers/command";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
	users: userRouter,
	commands: commandRouter
});

export type AppRouter = typeof appRouter;