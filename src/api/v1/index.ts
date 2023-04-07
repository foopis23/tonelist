import { FastifyPluginCallback, FastifyPluginOptions, FastifySchema } from "fastify";
import { Tonelist } from "../../tonelist";
import { Queue, errorSchema, ErrorSchema, queue } from "./schema-components";
import { StoreErrorType } from "../../store/types";

const getQueueSchema: FastifySchema = {
	params: {
		type: 'object',
		properties: {
			guildId: { type: 'string' }
		}
	},
	response: {
		200: queue,
		400: errorSchema,
		401: errorSchema,
		403: errorSchema,
		404: errorSchema
	}
};
type GetQueueSchema = {
	Params: {
		guildId: string
	},
	Response: {
		200: Queue,
		400: ErrorSchema,
		401: ErrorSchema,
		403: ErrorSchema,
		404: ErrorSchema
	}
}


const v1Routes: FastifyPluginCallback<FastifyPluginOptions & { tonelist: Tonelist }> = async function (fastify, opts) {
	const tonelist = opts.tonelist;

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
}

export default v1Routes;
