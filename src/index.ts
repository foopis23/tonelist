import { program, Option } from 'commander';
import getConfig from './config';
import tonelist from './tonelist';
import path from 'path';
import { TonelistConfig } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
	path: path.resolve(__dirname, '../.env'),
});

program
	.name('tonelist')
	.version('0.0.1', '-v, --version', 'output the current version')
	.addOption(new Option('--log-level <level>', 'set log level').choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'))
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

console.log(config);

tonelist.init(config, async () => {
	tonelist.logger.info('Tonelist started!');

	await tonelist.enqueue({
		channel: '711959134626644018',
		songURI: './songs/test.mp3',
	});
});
