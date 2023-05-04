import { Tonelist } from '../tonelist';
import { resolve } from 'path';
import { EnvConfig } from '../envConfig';
import { PrismaClient } from '@prisma/client';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import auth from './auth';
import vite from './vite';
import Fastify from 'fastify';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';


declare module 'fastify' {
	interface FastifyInstance {
		tonelist: Tonelist;
		prisma: PrismaClient;
	}

	interface FastifyRequest {
		tonelist: Tonelist;
		prisma: PrismaClient;
	}
}

type InitAPIOptions = {
	tonelist: Tonelist,
	env: EnvConfig
	prisma: PrismaClient
}

async function initHTTPServer({ tonelist, env, prisma }: InitAPIOptions) {
	const logger = tonelist.logger?.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	// decorate fastify with resources
	fastify.decorate('tonelist', tonelist);
	fastify.decorate('prisma', prisma);
	fastify.decorateRequest('tonelist', tonelist);
	fastify.decorateRequest('prisma', prisma);
	fastify.addHook('onRequest', async (request) => {
		request.tonelist = tonelist;
		request.prisma = prisma;
	});

	// authentication
	fastify.register(auth, { env });

	// trpc
	fastify.register(fastifyTRPCPlugin, {
		prefix: '/api/trpc',
		trpcOptions: { router: appRouter, createContext },
	});

	// frontend
	fastify.register(vite, {
		root: resolve(__dirname, '../client')
	})

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initHTTPServer;