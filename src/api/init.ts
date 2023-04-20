import fastifySwaggerUI from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import fastifySwagger from '@fastify/swagger';
import { GetQueueSchema, getQueueHandler, getQueueSchema } from './queues';
import { default as commandPlugin } from './commands';
import { CommandConfig } from '../commands/types';
import fastifyApiKeys from './fastify-api-keys';
import { getUsersAvailablePlayers, getUsersAvailablePlayersHandler } from './users';
import fastifyDiscordTokenAuth from './fastify-discord-token-auth';

declare module 'fastify' {
	interface FastifyRequest {
		tonelist: Tonelist;
	}
}

async function initAPI({ tonelist, commands, apiKeys, baseURL }: { tonelist: Tonelist, commands: Record<string, CommandConfig>, apiKeys: string[], baseURL: string }) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	fastify.decorateRequest('tonelist', null);
	fastify.addHook('onRequest', (request, _, done) => {
		request.tonelist = tonelist;
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
					apiKey: {
						type: 'apiKey',
						name: 'x-api-key',
						in: 'header'
					},
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

	// setup api keys auth
	await fastify.register(fastifyApiKeys, {
		keys: apiKeys
	});

	// setup token auth
	await fastify.register(fastifyDiscordTokenAuth);

	await fastify.register(async (fastify) => {
		fastify.addHook('preHandler', fastify.fastifyApiKeys.requiresAuthentication);

		// register guild routes
		await fastify.register(async (fastify) => {
			fastify.get<GetQueueSchema>('/queue', {
				schema: getQueueSchema
			}, getQueueHandler);

			await fastify.register(commandPlugin, { prefix: '/commands', commands });
		}, { prefix: '/guilds/:guildId' });

		await fastify.register(async (fastify) => {
			fastify.addHook('preHandler', fastify.discord.requiresAuthentication);

			fastify.get('/available-players', {
				schema: getUsersAvailablePlayers
			}, getUsersAvailablePlayersHandler);
		}, { prefix: '/users/@me' });
	});


	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;