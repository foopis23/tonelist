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

		console.log(opts.keys);

		if (!key || !opts.keys.includes(key)) {
			reply.code(401);
			throw new Error('Unauthorized');
		}

		return;
	};

	fastify.decorate('fastifyApiKeys', {
		requiresAuthentication
	});
});
