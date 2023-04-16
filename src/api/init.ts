import fastifySwaggerUI from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import fastifySwagger from '@fastify/swagger';
import { GetQueueSchema, getQueueHandler, getQueueSchema } from './queues';
import { default as commandPlugin } from './commands';
import { CommandConfig } from '../commands/types';

declare module 'fastify' {
	interface FastifyRequest {
		tonelist: Tonelist;
	}
}

async function initAPI({ tonelist, commands }: { tonelist: Tonelist, commands: Record<string, CommandConfig> }) {
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
					url: 'http://localhost:3000',
				}
			]
		}
	});
	await fastify.register(fastifySwaggerUI, {
		routePrefix: '/documentation'
	});

	// register guild routes
	await fastify.register(async (fastify) => {
		fastify.get<GetQueueSchema>('/queue', {
			schema: getQueueSchema
		}, getQueueHandler);

		await fastify.register(commandPlugin, { commands });
	}, { prefix: '/guilds/:guildId' });

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;