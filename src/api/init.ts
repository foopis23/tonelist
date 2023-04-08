import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import v1Routes from './v1';

async function initAPI(tonelist: Tonelist) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	fastify.register(v1Routes, { prefix: '/v1', tonelist, logger });

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;