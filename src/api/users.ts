import { RouteHandler } from "fastify";

type Guild = {
	id: string;
	name: string;
	icon: string;
	owner: boolean;
	permissions: string;
	features: string[];
};

export const getUsersAvailablePlayers = {
	summary: 'Get the available music players for a user',
	tags: ['Users'],
	security: [
		{
			"apiKey": [],
			"bearerAuth": []
		}
	],
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					icon: { type: 'string' }
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

export const getUsersAvailablePlayersHandler: RouteHandler = async (request) => {
	const userGuildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
		headers: {
			Authorization: `Bearer ${request.discord.token}`
		}
	});

	if (!userGuildsResponse.ok) {
		throw new Error('Failed to fetch guilds');
	}

	const userGuilds: Guild[] = await userGuildsResponse.json();
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
}
