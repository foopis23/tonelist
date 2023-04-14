import { JSONRPCServer, JSONRPCServerMiddleware, SimpleJSONRPCMethod } from "json-rpc-2.0";
import { APIUser } from "discord.js";
import { FastifyBaseLogger } from "fastify";
import { Tonelist } from "../../tonelist";
import { userHasGuildAccess } from "./access";

export interface RPCError {
	toRpcError(): {
		code: number;
		message: string;
	};
}

export class SimpleRPCError extends Error implements RPCError {
	constructor(message: string, public code: number) {
		super(message);
	}

	toRpcError() {
		return {
			code: this.code,
			message: this.message
		};
	}
}

// justification: this is a type guard, those we expect the user to pass in anything into it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isRpcError = (error: any): error is SimpleRPCError =>
	typeof error?.toRpcError === 'function';

export interface RPCServerParams {
	user: APIUser | null;
	logger: FastifyBaseLogger;
	tonelist: Tonelist
}

// methods
export const enqueue: SimpleJSONRPCMethod<RPCServerParams> = (opts, serverParams) => serverParams.tonelist.enqueue(opts);
export const remove: SimpleJSONRPCMethod<RPCServerParams> = (opts, serverParams) => serverParams.tonelist.remove(opts);
export const join: SimpleJSONRPCMethod<RPCServerParams> = (opts, serverParams) => serverParams.tonelist.join(opts);
export const leave: SimpleJSONRPCMethod<RPCServerParams> = (opts, serverParams) => serverParams.tonelist.leave(opts);
export const skip: SimpleJSONRPCMethod<RPCServerParams> = (opts, serverParams) => serverParams.tonelist.skip(opts);

// middleware
export const loggingMiddleware: JSONRPCServerMiddleware<RPCServerParams> = async (next, request, serverParams) => {
	const { logger } = serverParams;

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

export const exceptionMiddleware: JSONRPCServerMiddleware<RPCServerParams> = async (next, request, serverParams) => {
	const { logger } = serverParams;

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

export const requireUserInGuildMiddleware: JSONRPCServerMiddleware<RPCServerParams> = async (next, request, serverParams) => {
	const { guildId } = request.params;
	const { user, tonelist } = serverParams;

	if (!userHasGuildAccess({ user, guildID: guildId, tonelist })) {
		throw new SimpleRPCError("User does not have access to this guild", -32603);
	}

	return next(request, serverParams);
}


function initJSONRPC() {
	const server = new JSONRPCServer<RPCServerParams>();

	server.applyMiddleware(loggingMiddleware, exceptionMiddleware, requireUserInGuildMiddleware);
	server.addMethod('enqueue', enqueue);
	server.addMethod('remove', remove);
	server.addMethod('join', join);
	server.addMethod('leave', leave);
	server.addMethod('skip', skip);

	return server;
}

export default initJSONRPC;