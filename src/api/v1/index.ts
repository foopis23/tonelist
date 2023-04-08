import { FastifyPluginCallback, FastifyPluginOptions, FastifySchema } from "fastify";
import { Tonelist } from "../../tonelist";
import { jsonRpcRequest, JsonRpcRequest } from "./schema-components";
import { StoreErrorType } from "../../store/types";
import { JSONRPCServer, JSONRPCServerMiddleware } from "json-rpc-2.0";
import { Logger } from "pino";
import { isRpcError } from "./types";

const getQueueSchema: FastifySchema = {
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
	body: jsonRpcRequest,
};
type PostActionsSchema = {
	Body: JsonRpcRequest
};

const v1Routes: FastifyPluginCallback<FastifyPluginOptions & { tonelist: Tonelist, logger: Logger }> = async function (fastify, opts) {
	const tonelist = opts.tonelist;
	const logger = opts.logger;

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

	const jsonRpcServer = new JSONRPCServer();

	const loggingMiddleware: JSONRPCServerMiddleware<void> = async (next, request, serverParams) => {
		logger.info({ request }, 'incoming JSON-RPC request');

		const response = await next(request, serverParams);
		logger.info({
			response: {
				jsonrpc: response.jsonrpc,
				id: response.id,
				error: response.error,
			}
		}, 'completed JSON-RPC response');
		return response;
	};
	const exceptionMiddleware: JSONRPCServerMiddleware<void> = async (next, request, serverParams) => {
		try {
			return await next(request, serverParams);
		} catch (e) {
			if (isRpcError(e)) {
				return {
					jsonrpc: '2.0',
					id: request.id,
					error: e.toRpcError()
				}
			}

			logger.error({ err: e }, 'unhandled error in JSON-RPC request');

			return {
				jsonrpc: '2.0',
				id: request.id,
				error: {
					code: -32603,
					message: 'Internal error'
				}
			};
		}
	};

	jsonRpcServer.applyMiddleware(loggingMiddleware, exceptionMiddleware);
	jsonRpcServer.addMethod('enqueue', (opts) => tonelist.enqueue(opts));
	jsonRpcServer.addMethod('remove', (opts) => tonelist.remove(opts));
	jsonRpcServer.addMethod('join', (opts) => tonelist.join(opts));
	jsonRpcServer.addMethod('leave', (opts) => tonelist.leave(opts));
	jsonRpcServer.addMethod('skip', (opts) => tonelist.skip(opts));

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
