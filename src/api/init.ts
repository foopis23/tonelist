import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import v1Routes from './v1';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

async function initAPI(tonelist: Tonelist) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	await fastify.register(fastifySwagger, {
		swagger: {
			info: {
				version: '1.0.0',
				title: 'Tonelist2 API',
				description: 'Control Tonelist2 from an API'
			},
			host: 'localhost:3000',
			schemes: ['http'],
			consumes: ['application/json'],
			produces: ['application/json'],
			securityDefinitions: {
				ApiKey: {
					type: 'apiKey',
					name: 'X-API-KEY',
					in: 'header'
				},
				// BearerAuth: {
				// 	type: 'http',
				// 	scheme: 'bearer',
				// 	bearerFormat: 'JWT'
				// }
			}
		}
	});

	await fastify.register(fastifySwaggerUI, {
		routePrefix: '/api/documentation'
	});

	fastify.register(v1Routes, { prefix: '/api/v1', tonelist });

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;