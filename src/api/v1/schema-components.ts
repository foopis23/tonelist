import { FromSchema } from 'json-schema-to-ts';

export const errorSchema = {
	type: 'object',
	properties: {
		message: {
			type: 'string'
		},
	}
} as const;
export type ErrorSchema = FromSchema<typeof errorSchema>;

export const jsonRpcVersion = {
	type: 'string',
	enum: ['2.0']
} as const;
export type JsonRpcVersion = FromSchema<typeof jsonRpcVersion>;

export const jsonRpcId = {
	anyOf: [
		{ type: 'string' },
		{ type: 'number' }
	]
} as const;
export type JsonRpcId = FromSchema<typeof jsonRpcId>;

export const jsonRpcError = {
	type: 'object',
	properties: {
		code: {
			type: 'number',
			enum: [-32700, -32600, -32601, -32602, -32603]
		},
		message: {
			type: 'string',
			enum: ['Parse error', 'Invalid Request', 'Method not found', 'Invalid params', 'Internal error']
		},
	}
} as const;
export type JsonRpcError = FromSchema<typeof jsonRpcError>;

export const anyValue = {
	anyOf: [
		{ type: 'string' },
		{ type: 'number' },
		{ type: 'integer' },
		{ type: 'boolean' },
		{ type: 'object' },
		{ type: 'array' }
	]
} as const;

export const jsonRpcResponse = {
	type: 'object',
	properties: {
		jsonrpc: jsonRpcVersion,
		id: jsonRpcId,
		result: anyValue
	}
} as const;
export type JsonRpcResponse = FromSchema<typeof jsonRpcResponse>;

export const jsonRpcRequest = {
	type: 'object',
	properties: {
		jsonrpc: jsonRpcVersion,
		id: jsonRpcId,
		method: {
			type: 'string',
			// TODO: maybe auto populate this
			enum: ["enqueue", "join", "leave", "remove", "skip"]
		},
		params: anyValue
	},
	required: ['jsonrpc', 'method']
} as const;
export type JsonRpcRequest = FromSchema<typeof jsonRpcRequest>;

export const queue = {
	type: 'object',
	properties: {
		tracks: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					track: {
						type: 'string'
					},
					info: {
						type: 'object',
						properties: {
							identifier: {
								type: 'string'
							},
							isStream: {
								type: 'boolean'
							},
							isSeekable: {
								type: 'boolean'
							},
							author: {
								type: 'string'
							},
							length: {
								type: 'number'
							},
							position: {
								type: 'number'
							},
							title: {
								type: 'string'
							},
							uri: {
								type: 'string'
							},
							sourceName: {
								type: 'string'
							}
						}
					}
				}
			}
		}
	}
} as const;
export type Queue = FromSchema<typeof queue>;
