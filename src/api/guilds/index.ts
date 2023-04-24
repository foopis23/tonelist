import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import { CommandConfig } from "../../commands/types";
import { commands } from "./commands";
import { FromSchema } from "json-schema-to-ts";
import { errorSchema, queueSchema, trackSchema, userSchema } from "../schema-components";
import { getItem } from "../../util/discord-cache";
import { APIGuild, Channel, Guild } from "discord.js";
import { isVoiceBasedChannel } from "../../types";

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
			type: 'object',
			properties: {
				...trackSchema.properties,
				accuratePosition: { type: 'number' }
			}
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
		const userGuildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
			headers: {
				Authorization: `Bearer ${request.discord.token}`
			}
		});

		if (!userGuildsResponse.ok) {
			switch (userGuildsResponse.status) {
				case 401:
					reply.status(401);
					throw new Error('Failed to fetch guilds');
				case 403:
					reply.status(403);
					throw new Error('Failed to fetch guilds');
				default:
					reply.status(500);
					throw new Error('Failed to fetch guilds');
			}
		}

		// TODO: type validate this?
		const userGuilds = await userGuildsResponse.json() as APIGuild[];

		if (!userGuilds.some((guild: { id: string }) => guild.id === request.params.guildId)) {
			reply.status(403);
			throw new Error('User is not in guild');
		}
	});

	fastify.get<GetQueueSchema>('/:guildId/queue', {
		schema: getQueueSchema
	}, async (request) => {
		return await request.tonelist.findQueue(request.params.guildId);
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

	fastify.get<GetCurrentTrackSchema>('/:guildId/currentTrack', {
		schema: getCurrentTrackSchema
	}, async (request) => {
		return request.tonelist.getCurrentTrack(request.params.guildId);
	});

	await fastify.register(commands, { prefix: '/:guildId/commands', commands: opts.commands });
}