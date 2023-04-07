import Fastify from 'fastify';
import { Tonelist } from '../tonelist';

async function initAPI(tonelist: Tonelist) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	fastify.get('/', async () => {
		return { hello: 'world' }
	});

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;