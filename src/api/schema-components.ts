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

export const baseRpcRequest = {
	type: 'object',
	properties: {
		guildId: {
			type: 'string'
		},
	},
	required: ['guildId']
} as const;

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
