import { FromSchema } from 'json-schema-to-ts';

export const errorSchema = {
	type: 'object',
	properties: {
		statusCode: { type: 'number' },
		error: { type: 'string' },
		message: { type: 'string' }
	}
} as const;
export type ErrorSchema = FromSchema<typeof errorSchema>;

export const baseRpcRequest = {
	type: 'object',
	properties: {
		guildId: {
			type: 'string'
		},
	},
	required: ['guildId']
} as const;

export const trackSchema = {
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
} as const;

export const queueSchema = {
	type: 'object',
	properties: {
		tracks: {
			type: 'array',
			items: trackSchema
		}
	}
} as const;
export type Queue = FromSchema<typeof queueSchema>;

export const guildSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		name: { type: 'string' },
		icon: { type: 'string' }
	}
};

export const userSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		username: { type: 'string' },
		avatar: { type: 'string' }
	}
};