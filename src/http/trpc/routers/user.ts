import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
	getMe: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	})
})