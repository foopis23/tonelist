import { inferAsyncReturnType } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export function createContext({ req, res }: CreateFastifyContextOptions) {
	return { req, res, prisma: req.prisma, tonelist: req.tonelist, user: req.user };
}
export type Context = inferAsyncReturnType<typeof createContext>;
