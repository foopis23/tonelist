import { program, Option } from 'commander';
import getConfig from './config';
import tonelist from './tonelist';
import { InitOptions } from './types';

program
	.name('tonelist')
	.version('0.0.1', '-v, --version', 'output the current version')
	.addOption(new Option('--log-level <level>', 'set log level').choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']))
	.option('--token <token>', 'set Discord bot token')
	.option('--client-id <id>', 'set Discord client ID')

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

tonelist.init(initOptions, async () => {
	await tonelist.join({
		guildId: '637502626120073218',
		voiceChannelId: '711959134626644018'
	})

	await tonelist.enqueue({
		guildId: '637502626120073218',
		voiceChannelId: '711959134626644018',
		query: 'ytsearch:tatsuro yamashita - for you'
	})
});
