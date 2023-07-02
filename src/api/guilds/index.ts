import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import { CommandConfig } from "../../commands/types";
import { commands } from "./commands";
import { FromSchema } from "json-schema-to-ts";
import { errorSchema, queueSchema, trackSchema, userSchema } from "../schema-components";
import { getItem } from "../../util/discord-cache";
import { APIGuild, Channel, Guild } from "discord.js";
import { isVoiceBasedChannel } from "../../types";
import { FetchError } from "../../util/cached-fetch";

const guildParams = {
	type: 'object',
	properties: {
		guildId: { type: 'string' }
	},
	required: ['guildId'],
} as const;

const getQueueSchema = {
	summary: 'Get the queue for a guild',
	tags: ['Guilds'],
	params: guildParams,
	security: [
		{
			"bearerAuth": []
		}
	],
	response: {
		200: queueSchema,
		401: errorSchema,
		403: errorSchema,
		500: errorSchema
	}
};
type GetQueueSchema = {
	Params: FromSchema<typeof getQueueSchema.params>
}

const getListenersSchema = {
	summary: 'Get all the members that are listening to music in a guild',
	tags: ['Guilds'],
	params: guildParams,
	security: [
		{
			"bearerAuth": []
		}
	],
	response: {
		200: {
			type: 'array',
			items: userSchema
		},
		401: errorSchema,
		403: errorSchema,
		500: errorSchema
	}
};
type GetListenersSchema = {
	Params: FromSchema<typeof getListenersSchema.params>
}

const getCurrentTrackSchema = {
	summary: 'Get the currently playing track for a guild',
	tags: ['Guilds'],
	params: guildParams,
	security: [
		{
			"bearerAuth": []
		}
	],
	response: {
		200: {
			oneOf: [
				{
					type: 'object',
					properties: {
						...trackSchema.properties,
						accuratePosition: { type: 'number' }
					}
				},
				{
					type: 'object',
					properties: {}
				}
			]
		},
		401: errorSchema,
		403: errorSchema,
		500: errorSchema
	}
};
type GetCurrentTrackSchema = {
	Params: FromSchema<typeof getCurrentTrackSchema.params>
};

export const guildRoutes: FastifyPluginAsync<FastifyPluginOptions & { commands: Record<string, CommandConfig> }> = async function (fastify, opts) {
	// user must be in guild access control
	fastify.addHook<{ Params: FromSchema<typeof guildParams> }>('preHandler', async (request, reply) => {
		try {
			try {
				const userGuilds = await request.fetch<APIGuild[]>('https://discord.com/api/users/@me/guilds', {
					request: {
						headers: {
							Authorization: `Bearer ${request.discord.token}`
						}
					}
				});

				if (!userGuilds.some((guild: { id: string }) => guild.id === request.params.guildId)) {
					reply.status(403);
					throw new Error('User is not in guild');
				}
			} catch (e) {
				if (e instanceof FetchError) {
					switch (e.response.status) {
						case 401:
						case 403:
						case 429:
							reply.status(e.response.status);
					}
				}
				throw new Error('Failed to fetch guilds');
			}
		} catch (err) {
			if (err instanceof FetchError) {
				switch (err.response.status) {
					case 401:
					case 403:
					case 429:
						reply.status(err.response.status);
						throw new Error('Failed to fetch guilds');
					default:
						reply.status(500);
						throw new Error('Failed to fetch guilds');
				}
			}
		}
	});

	fastify.get<GetQueueSchema>('/:guildId/queue', {
		schema: getQueueSchema
	}, async (request) => {
		try {
			return await request.tonelist.findQueue(request.params.guildId);
		} catch (e) {
			return {
				tracks: [],
			}
		}
	});

	fastify.get<GetListenersSchema>('/:guildId/listeners', {
		schema: getListenersSchema
	}, async (request) => {
		const channelId = request.tonelist.node.players.get(request.params.guildId)?.channelId;
		if (!channelId) {
			return [];
		}

		const guild = await getItem<Guild>(request.tonelist.client.guilds, request.params.guildId);
		const channel = await getItem<Channel>(guild.channels, channelId);

		if (!isVoiceBasedChannel(channel)) {
			return [];
		}

		return channel.members
			.filter(member => !member.user.bot)
			.map(member => ({
				id: member.id,
				username: member.user.username,
				avatar: member.user.avatarURL()
			}));
	});

	fastify.get<GetCurrentTrackSchema>('/:guildId/current-track', {
		schema: getCurrentTrackSchema
	}, async (request) => {
		return request.tonelist.getCurrentTrack(request.params.guildId);
	});

	await fastify.register(commands, { prefix: '/:guildId/commands', commands: opts.commands });
}