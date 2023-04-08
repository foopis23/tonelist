import { FastifyPluginCallback, FastifyPluginOptions, FastifySchema } from "fastify";
import { Tonelist } from "../../tonelist";
import { jsonRpcRequest, JsonRpcRequest } from "./schema-components";
import { StoreErrorType } from "../../store/types";
import { Logger } from "pino";
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import initJSONRPC from "./jsonrpc";

const getQueueSchema: FastifySchema = {
	summary: 'Get the queue for a guild',
	params: {
		type: 'object',
		properties: {
			guildId: { type: 'string' }
		},
		required: ['guildId']
	}
};
type GetQueueSchema = {
	Params: {
		guildId: string
	}
}

const postActionsSchema: FastifySchema = {
	summary: 'Perform a command',
	body: jsonRpcRequest
};
type PostActionsSchema = {
	Body: JsonRpcRequest
};

const v1Routes: FastifyPluginCallback<FastifyPluginOptions & { tonelist: Tonelist, logger: Logger }> = async function (fastify, opts) {
	const tonelist = opts.tonelist;
	const jsonRpcServer = initJSONRPC(opts);

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
					apiKey: {
						type: 'apiKey',
						name: 'X-API-Key',
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


	fastify.get<GetQueueSchema>('/queues/:guildId', {
		schema: getQueueSchema
	}, async (request, reply) => {
		// TODO: if req.user is not in guild, return 403
		// TODO: if req.apiKey does not read:queues permission, return 403

		try {
			const queue = await tonelist.findQueue(request.params.guildId);

			// TODO: paginate

			return queue;
		} catch (e) {
			if (e.type === StoreErrorType.NOT_FOUND) {
				reply.code(404);
				throw e;
			}
		}
	});

	fastify.post<PostActionsSchema>('/actions', {
		schema: postActionsSchema
	}, async (request, reply) => {
		// TODO: if req.user is not in guild, return 403
		// TODO: if req.apiKey does not read:queues permission, return 403

		const jsonRpcRequest = request.body;
		const response = await jsonRpcServer.receive(jsonRpcRequest).then((response) => {
			return response;
		})

		if (response.error != undefined) {
			reply.code(500);
		}

		return response;
	});
}

export default v1Routes;
