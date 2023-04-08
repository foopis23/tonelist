import { Logger } from "pino";
import { Tonelist } from "../../tonelist";
import { JSONRPCServer, JSONRPCServerMiddleware } from "json-rpc-2.0";
import { isRpcError } from "./types";

function initJSONRPC({ tonelist, logger }: { tonelist: Tonelist, logger: Logger }) {
	const server = new JSONRPCServer();

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

	server.applyMiddleware(loggingMiddleware, exceptionMiddleware);
	server.addMethod('enqueue', (opts) => tonelist.enqueue(opts));
	server.addMethod('remove', (opts) => tonelist.remove(opts));
	server.addMethod('join', (opts) => tonelist.join(opts));
	server.addMethod('leave', (opts) => tonelist.leave(opts));
	server.addMethod('skip', (opts) => tonelist.skip(opts));

	return server;
}

export default initJSONRPC;