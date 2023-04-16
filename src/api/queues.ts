import { FromSchema } from "json-schema-to-ts";
import { RouteHandler } from "fastify";

export const getQueueSchema = {
	summary: 'Get the queue for a guild',
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
	]
};
export type GetQueueSchema = {
	Params: FromSchema<typeof getQueueSchema.params>
}

export const getQueueHandler: RouteHandler<GetQueueSchema> = async (request) => {
	const queue = await request.tonelist.findQueue(request.params.guildId);

	// TODO: paginate

	return queue;
}
