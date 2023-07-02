import env from './envConfig';
import { Tonelist, InitOptions } from './tonelist';
import initInteractions from './interactions/init';
import initHTTPServer from './http/init';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const tonelistOptions: InitOptions = {
	token: env.DISCORD_TOKEN,
	clientId: env.DISCORD_CLIENT_ID,
	lavaConnectionInfo: {
		host: env.LAVA_HOST,
		port: env.LAVA_PORT,
		password: env.LAVA_PASSWORD
	},
	loggerOptions: {
		level: env.LOG_LEVEL
	},
	commandOptions: {
		testGuilds: env.BOT_TEST_GUILDS
	}
};

const tonelist = new Tonelist(tonelistOptions);
tonelist.init(async () => {
	await prisma.$connect();
	await Promise.all([
		initInteractions(
			tonelist,
			{
				...tonelistOptions?.commandOptions ?? {}
			}
		),
		initHTTPServer({
			tonelist,
			env,
			prisma
		})
	])

	tonelist.logger?.info('Tonelist is ready!');
});
