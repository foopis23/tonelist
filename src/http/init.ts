import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import fastifyVite from './vite';
import { resolve } from 'path';

declare module 'fastify' {
	interface FastifyRequest {
		tonelist: Tonelist;
	}
}

type InitAPIOptions = {
	tonelist: Tonelist,
}

async function initHTTPServer({ tonelist }: InitAPIOptions) {
	const logger = tonelist.logger.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	// add tonelist to request
	// add cached fetch to request
	fastify.decorateRequest('tonelist', null);
	fastify.addHook('onRequest', (request, _, done) => {
		request.tonelist = tonelist;
		// request.fetch = fetchClient.fetch.bind(fetchClient);
		done();
	});

	fastify.get('/hello', async () => {
		return { hello: 'world' };
	});

	fastify.register(fastifyVite, {
		root: resolve(__dirname, '../client'),
		printViteDevServerHost: true,
	})

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initHTTPServer;