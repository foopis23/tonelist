import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import initV1API from './v1/init';

declare module 'fastify' {
	interface FastifyInstance {
		tonelist: Tonelist;
	}

	interface FastifyRequest {
		tonelist: Tonelist;
	}
}

async function initAPI({ tonelist }: { tonelist: Tonelist }) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	fastify.decorate('tonelist', tonelist);
	fastify.decorateRequest('tonelist', tonelist);
	fastify.addHook('onRequest', (request, reply, done) => {
		request.tonelist = tonelist;
		done();
	});

	fastify.register(initV1API, { prefix: '/v1' });

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initAPI;