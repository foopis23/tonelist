import { FromSchema } from "json-schema-to-ts";
import { RouteHandler } from "fastify";

export const getQueueSchema = {
	summary: 'Get the queue for a guild',
	tags: ['Guilds'],
	params: {
		type: 'object',
		properties: {
			guildId: { type: 'string' }
		},
		required: ['guildId'],
	} as const,
	security: [
		{
			"apiKey": []
		}
	],
	response: {
		200: {
			type: 'object',
			properties: {
				textChannel: { type: 'string' },
				tracks: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							track: { type: 'string' },
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
		},
		401: {
			type: 'object',
			properties: {
				statusCode: { type: 'number' },
				error: { type: 'string' },
				message: { type: 'string' }
			}
		},
		403: {
			type: 'object',
			properties: {
				statusCode: { type: 'number' },
				error: { type: 'string' },
				message: { type: 'string' }
			}
		},
		500: {
			type: 'object',
			properties: {
				statusCode: { type: 'number' },
				error: { type: 'string' },
				message: { type: 'string' }
			}
		}
	}
};
export type GetQueueSchema = {
	Params: FromSchema<typeof getQueueSchema.params>
}

export const getQueueHandler: RouteHandler<GetQueueSchema> = async (request) => {
	const queue = await request.tonelist.findQueue(request.params.guildId);

	// TODO: paginate

	return queue;
}
