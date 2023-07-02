import env from './envConfig';
import tonelist, { InitOptions } from './tonelist';
import initInteractions from './interactions/init';
import initHTTPServer from './http/init';
import { enqueue, join, leave, list, remove, skip } from './commands';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


const commands = {
	list,
	enqueue,
	remove,
	join,
	leave,
	skip
}

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
		testGuilds: env.BOT_TEST_GUILDS,
		commands
	}
};

tonelist.init(tonelistOptions, async () => {
	await prisma.$connect();
	await Promise.all([
		initInteractions(
			tonelist,
			{
				...tonelistOptions?.commandOptions ?? {},
				commands
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
