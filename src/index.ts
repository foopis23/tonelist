import { program, Option } from 'commander';
import getConfig from './config';
import tonelist from './tonelist';
import path from 'path';
import { TonelistConfig } from './types';
import dotenv from 'dotenv';

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
	.option('--mongo-uri <host>', 'set database host')
	.option('--client-id <id>', 'set Discord client ID')

program.parse(process.argv);

const options = program.opts();
const config: TonelistConfig = {
	...getConfig(options),
	testGuilds: ['637502626120073218'],
	useTestGuilds: true
}

tonelist.init(config, async () => {
	tonelist.logger.info('Tonelist started!');
});
