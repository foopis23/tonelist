import { FastifyPluginCallback, FastifyPluginOptions } from "fastify";
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import v1Routes from "./routes";
import discordTokenAuth from "../plugins/discord-token-auth";
import initJSONRPC, { RPCServerParams } from "./rpc";
import { JSONRPCServer } from "json-rpc-2.0";

declare module 'fastify' {
	interface FastifyInstance {
		rpc: JSONRPCServer<RPCServerParams>
	}
}

const initV1API: FastifyPluginCallback<FastifyPluginOptions> = async function (fastify) {
	// setup authentication
	await fastify.register(discordTokenAuth);

	// register swagger
	await fastify.register(fastifySwagger, {
		openapi: {
			info: {
				version: '1.0.0',
				title: 'Tonelist2 v1 API',
				description: 'Control Tonelist2 from an API'
			},
			servers: [
				{
					url: 'http://localhost:3000',
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

	fastify.decorate('rpc', initJSONRPC())

	// register routes
	await fastify.register(v1Routes);
}

export default initV1API;