import { program, Option } from 'commander';
import getConfig from './config';
import tonelist from './tonelist';
import path from 'path';
import dotenv from 'dotenv';
import { InitOptions } from './types';

/*
 * Load environment variables from .env files
 * The order of loading is as follows:
 * 1. .env
 * 2. .env.{NODE_ENV}
 * 3. .env.local
 * 4. .env.{NODE_ENV}.local
 */

dotenv.config({
	path: path.resolve(__dirname, '../.env'),
	override: true
});

if (process.env.NODE_ENV) {
	dotenv.config({
		path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`),
		override: true
	});
}

dotenv.config({
	path: path.resolve(__dirname, '../.env.local'),
	override: true
})

if (process.env.NODE_ENV) {
	dotenv.config({
		path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}.local`),
		override: true
	});
}

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
