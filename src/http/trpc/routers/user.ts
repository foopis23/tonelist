import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
	getUser: protectedProcedure
		.input(z.object({
			id: z.string().nonempty()
		}))
		.query(async ({ ctx, input }) => {
			if (ctx.user.id !== input.id && input.id !== '@me') {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You are not authorized to view this user'
				})
			}

			const id = input.id === '@me' ? ctx.user.id : input.id;
			return await ctx.prisma.user.findUnique({
				where: {
					id
				}
			});
		})
})