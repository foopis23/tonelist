import { errorSchema, guildSchema } from './schema-components';
import { FastifyPluginAsync } from "fastify";
import { isVoiceBasedChannel } from '../types';
import { APIPartialGuild } from 'discord.js';

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
		const userGuildsResponse = await fetch(`https://discord.com/api/users/@me/guilds`, {
			headers: {
				Authorization: `Bearer ${request.discord.token}`
			}
		});

		if (!userGuildsResponse.ok) {
			if (userGuildsResponse.status === 401 || userGuildsResponse.status === 403) {
				reply.code(userGuildsResponse.status);
			}

			throw new Error('Failed to fetch guilds');
		}

		const userGuilds: APIPartialGuild[] = await userGuildsResponse.json();
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
	});

	fastify.get('/@me/current-player', {
		schema: getCurrentPlayer
	}, async (request, reply) => {
		const userGuildsResponse = await fetch(`https://discord.com/api/users/@me/guilds`, {
			headers: {
				Authorization: `Bearer ${request.discord.token}`
			}
		});

		if (!userGuildsResponse.ok) {
			if (userGuildsResponse.status === 401 || userGuildsResponse.status === 403) {
				reply.code(userGuildsResponse.status);
			}

			throw new Error('Failed to fetch guilds');
		}

		const guildIds = Array.from(request.tonelist.node.players.values()).map(player => player.guildId)
		const userGuilds: APIPartialGuild[] = await userGuildsResponse.json();
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
	});
}
