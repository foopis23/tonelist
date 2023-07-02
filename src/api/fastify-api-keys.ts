import { FastifyPluginOptions, preHandlerAsyncHookHandler } from 'fastify';
import fp from 'fastify-plugin';

type Options = FastifyPluginOptions & {
	keys: string[];
}

declare module 'fastify' {
	interface FastifyInstance {
		fastifyApiKeys: {
			requiresAuthentication: preHandlerAsyncHookHandler;
		};
	}
}

export default fp(async function (fastify, opts: Options) {
	const requiresAuthentication: preHandlerAsyncHookHandler = async (request, reply) => {
		const key = request.headers['x-api-key'] as string;

		if (!key) {
			reply.code(401);
			throw new Error('Unauthorized');
		}

		if (!opts.keys.includes(key)) {
			reply.code(403);
			throw new Error('Forbidden');
		}

		return;
	};

	fastify.decorate('fastifyApiKeys', {
		requiresAuthentication
	});
});
