import { errorSchema, guildSchema } from './schema-components';
import { FastifyPluginAsync } from "fastify";
import { isVoiceBasedChannel } from '../types';
import { APIPartialGuild } from 'discord.js';
import { FetchError } from '../util/cached-fetch';

const getUsersAvailablePlayers = {
	summary: 'Get the available music players for a user',
	tags: ['Users'],
	security: [
		{
			"bearerAuth": []
		}
	],
	response: {
		200: {
			type: 'array',
			items: guildSchema
		},
		401: errorSchema,
		403: errorSchema,
		500: errorSchema
	}
};

const getCurrentPlayer = {
	summary: 'Get the player the user is currently listening to',
	tags: ['Users'],
	security: [
		{
			"bearerAuth": []
		}
	],
	response: {
		200: guildSchema,
		401: errorSchema,
		403: errorSchema,
		500: errorSchema
	}
};

export const userRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get('/@me/available-players', {
		schema: getUsersAvailablePlayers
	}, async (request, reply) => {
		try {
			const userGuilds = await request.fetch<APIPartialGuild[]>(`https://discord.com/api/users/@me/guilds`, {
				request: {
					headers: {
						Authorization: `Bearer ${request.discord.token}`
					}
				}
			});

			const botGuilds = Array.from((await request.tonelist.client.guilds.fetch()).values());

			return botGuilds.filter(botGuild => {
				return userGuilds.some(userGuild => userGuild.id === botGuild.id);
			}).map(botGuild => {
				return {
					id: botGuild.id,
					name: botGuild.name,
					icon: botGuild.iconURL()
				};
			});
		} catch (e) {
			if (e instanceof FetchError) {
				if (e.response.status === 401 || e.response.status === 403 || e.response.status === 429) {
					reply.code(e.response.status);
				}

				request.log.error(e);

				throw new Error('Failed to fetch guilds');
			} else {
				reply.code(500);
				request.log.error(e);
				throw new Error('Failed to fetch guilds');
			}
		}
	});

	fastify.get('/@me/current-player', {
		schema: getCurrentPlayer
	}, async (request, reply) => {
		try {
			const userGuilds = await request.fetch<APIPartialGuild[]>(`https://discord.com/api/users/@me/guilds`, {
				request: {
					headers: {
						Authorization: `Bearer ${request.discord.token}`
					}
				}
			});
			const guildIds = Array.from(request.tonelist.node.players.values()).map(player => player.guildId)
			const commonGuildIds = userGuilds.filter(guild => guildIds.includes(guild.id));

			for (const guild of commonGuildIds) {
				const discordBotGuild = await request.tonelist.client.guilds.fetch(guild.id);
				const channels = await discordBotGuild.channels.fetch();
				const voiceChannels = channels.filter(channel => isVoiceBasedChannel(channel));
				for (const vc of voiceChannels.values()) {
					const currentUserInChannel = vc.members.some(member => member.id === request.discord.user.id);
					if (currentUserInChannel) {
						return {
							id: discordBotGuild.id,
							name: discordBotGuild.name,
							icon: discordBotGuild.iconURL()
						};
					}
				}
			}

			return {};
		} catch (err) {
			if (err instanceof FetchError) {
				if (err.response.status === 401 || err.response.status === 403 || err.response.status === 429) {
					reply.code(err.response.status);
				}

				request.log.error(err);

				throw new Error('Failed to fetch guilds');
			} else {
				reply.code(500);
				request.log.error(err);

				throw new Error('Failed to fetch guilds');
			}
		}
	});
}
