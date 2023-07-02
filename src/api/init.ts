import fastifySwaggerUI from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import fastifySwagger from '@fastify/swagger';
import { CommandConfig } from '../commands/types';
import fastifyRateLimit from '@fastify/rate-limit';
import { guildRoutes } from './guilds';
import { userRoutes } from './users';
import fastifyDiscordTokenAuth from './auth/fastify-discord-token-auth';
import { trackRoutes } from './tracks';
import cors from '@fastify/cors';
import { CachedFetchClient } from '../util/cached-fetch';
import { MemoryStore } from '@foopis23/ts-store';

declare module 'fastify' {
	interface FastifyRequest {
		tonelist: Tonelist;
		fetch: CachedFetchClient['fetch'];
	}
}

type InitAPIOptions = {
	tonelist: Tonelist,
	commands: Record<string, CommandConfig>,
	baseURL: string,
	maxRequestsPerMinute?: number
}


async function initAPI({ tonelist, commands, baseURL, maxRequestsPerMinute = 1000 }: InitAPIOptions) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	const fetchClient = new CachedFetchClient({
		cache: new MemoryStore(),
		cacheTTL: 1000 * 60,
	})

	await fastify.register(cors, {
		origin: '*',
	})

	// set cors header
	fastify.addHook('onSend', (request, reply, payload, done) => {
		reply.header('Access-Control-Allow-Origin', '*');
		done();
	});

	// add tonelist to request
	// add cached fetch to request
	fastify.decorateRequest('tonelist', null);
	fastify.decorateRequest('fetch', null);
	fastify.addHook('onRequest', (request, _, done) => {
		request.tonelist = tonelist;
		request.fetch = fetchClient.fetch.bind(fetchClient);
		done();
	});

	// register swagger
	await fastify.register(fastifySwagger, {
		openapi: {
			info: {
				version: '1.0.0',
				title: 'Tonelist2 API',
				description: 'Control Tonelist2 from an API'
			},
			servers: [
				{
					url: baseURL,
				}
			],
			components: {
				securitySchemes: {
					bearerAuth: {
						type: 'http',
						scheme: 'bearer',
					}
				}
			}
		}
	});
	await fastify.register(fastifySwaggerUI, {
		routePrefix: '/documentation'
	});

	// setup token auth
	await fastify.register(fastifyDiscordTokenAuth);

	// rate limited routes and access controlled routes
	await fastify.register(async (fastify) => {
		// rate limit all routes in this context
		fastify.register(fastifyRateLimit, {
			global: true,
			max: maxRequestsPerMinute,
			timeWindow: 1000 * 60,
			ban: 5
		});

		// require authentication for all routes in this context
		fastify.addHook('preHandler', fastify.discord.requiresAuthentication);

		// register guild routes
		await fastify.register(guildRoutes, { prefix: '/guilds', commands });

		// user routes
		await fastify.register(userRoutes, { prefix: '/users' });
	});

	// add endpoint for getting track thumbnails
	await fastify.register(async (fastify) => {
		// rate limit all routes in this context
		fastify.register(fastifyRateLimit, {
			global: false,
			max: maxRequestsPerMinute,
			timeWindow: 2000 * 60,
			ban: 5
		});

		await fastify.register(trackRoutes, {
			prefix: '/tracks'
		});
	});


	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;