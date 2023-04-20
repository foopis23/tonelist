import { APIUser } from 'discord.js';
import { preHandlerAsyncHookHandler } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
	interface FastifyInstance {
		discord: {
			requiresAuthentication: preHandlerAsyncHookHandler;
		}
	}

	interface FastifyRequest {
		discord: {
			user?: APIUser,
			token?: string,
		}
	}
}

export default fp(async function (fastify) {
	const requiresAuthentication: preHandlerAsyncHookHandler = async (request, reply) => {
		if (!request.headers.authorization) {
			reply.code(401);
			throw new Error('Unauthorized');
		}

		const [type] = request.headers.authorization.split(' ');

		if (type !== 'Bearer') {
			reply.code(400);
			throw new Error('Bad Request');
		}

		if (!request.discord.user) {
			reply.code(403);
			throw new Error('Forbidden');
		}
	}

	fastify.decorate('discord', {
		requiresAuthentication
	});

	fastify.decorateRequest('discord', {});
	fastify.addHook('preValidation', async (request) => {
		if (!request.headers.authorization) {
			return;
		}

		const [type, token] = request.headers.authorization.split(' ');

		if (type !== 'Bearer') {
			return;
		}

		const userResponse = await fetch('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!userResponse.ok) {
			return;
		}

		const user = await userResponse.json() as APIUser;
		request.discord.user = user;
		request.discord.token = token;
	});
});