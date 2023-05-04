import { TRPCError, initTRPC } from '@trpc/server';
import { Context } from './context';

export const t = initTRPC
	.context<Context>()
	.create();

export const publicProcedure = t.procedure;

const authMiddleware = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to perform this action',
		});
	}
	return next();
});

export const protectedProcedure = t.procedure.use(authMiddleware)

export const router = t.router;
export const middleware = t.middleware;
