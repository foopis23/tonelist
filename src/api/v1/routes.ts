import { FastifyPluginCallback, FastifyPluginOptions, FastifySchema } from "fastify";
import { Tonelist } from "../../tonelist";
import { jsonRpcRequest, JsonRpcRequest } from "./schema-components";
import { requiresAuthentication } from "../plugins/discord-token-auth";
import { userHasGuildAccess } from "./access";

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

const v1Routes: FastifyPluginCallback<FastifyPluginOptions & { tonelist: Tonelist }> = async function (fastify) {
	fastify.get<GetQueueSchema>('/queues/:guildId', {
		schema: getQueueSchema,
		preHandler: [requiresAuthentication]
	}, async (request, reply) => {
		const user = request.user;

		if (!userHasGuildAccess({ user, guildID: request.params.guildId, tonelist: request.tonelist })) {
			reply.code(403);
			throw new Error('User does not have access to this guild');
		}

		const queue = await fastify.tonelist.findQueue(request.params.guildId);

		// TODO: paginate

		return queue;
	});

	fastify.post<PostActionsSchema>('/actions', {
		schema: postActionsSchema,
		preHandler: [requiresAuthentication]
	}, async (request, reply) => {
		const jsonRpcRequest = request.body;
		const response = await fastify.rpc.receive(jsonRpcRequest, {
			user: request.user,
			tonelist: request.tonelist,
			logger: request.log
		}).then((response) => {
			return response;
		})

		if (response.error != undefined) {
			reply.code(500);
		}

		return response;
	});
}

export default v1Routes;
