import { program, Option } from 'commander';
import getConfig from './config';
import tonelist, { InitOptions } from './tonelist';
import initInteractions from './interactions/init';
import initAPI from './api/init';
import { enqueue, join, leave, list, remove, skip } from './commands';

program
	.name('tonelist')
	.version('2.0.0-alpha.2', '-v, --version', 'output the current version')
	.addOption(new Option('--log-level <level>', 'set log level').choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']))
	.option('--token <token>', 'set Discord bot token')
	.option('--client-id <id>', 'set Discord client ID')
	.option('--lava-host <host>', 'set Lavalink host')
	.option('--lava-port <port>', 'set Lavalink port')
	.option('--lava-password <password>', 'set Lavalink password')
	.option('--test-guilds <guilds>', 'set comma-separated list of guild IDs to enable test mode');

program.parse(process.argv);

const options = program.opts();
const config = getConfig(options);

const initOptions: InitOptions = {
	token: config.token,
	clientId: config.clientId,
	lavaConnectionInfo: {
		host: config.lavaHost,
		port: config.lavaPort,
		password: config.lavaPassword
	}
};

if (config.logLevel) {
	initOptions.loggerOptions = {
		level: config.logLevel
	};
}

if (config.testGuilds) {
	initOptions.commandOptions = {
		testGuilds: config.testGuilds.split(',')
	};
}

const commands = {
	list,
	enqueue,
	remove,
	join,
	leave,
	skip
}

tonelist.init(initOptions, async () => {
	await Promise.all([
		initInteractions(
			tonelist,
			{
				...options?.commandOptions ?? {},
				commands
			}
		),
		initAPI({
			tonelist,
			commands,
			baseURL: config.baseUrl ?? 'http://localhost:3000',
			maxRequestsPerMinute: config.apiMaxRequestsPerMinute
		})
	])

	tonelist.logger.info('Tonelist is ready!');
});
