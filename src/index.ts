import { program, Option } from 'commander';
import getConfig from './config';
import tonelist from './tonelist';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
	path: path.resolve(__dirname, '../.env'),
});

program
	.name('tonelist')
	.version('0.0.1', '-v, --version', 'output the current version')
	.addOption(new Option('--log-level <level>', 'set log level').choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'))
	.option('--token <token>', 'set Discord bot token');

program.parse(process.argv);

const options = program.opts();
const config = getConfig(options);

tonelist.init(config, () => {
	tonelist.logger.info('Tonelist started!');

	Promise.all([
		tonelist.enqueue({
			channel: '711959134626644018',
			songURI: './songs/test.mp3',
		}),
		tonelist.enqueue({
			channel: '711959134626644018',
			songURI: './songs/test2.mp3',
		})
	]).then(async () => {
		tonelist.logger.info(await tonelist.getQueue({ channel: '711959134626644018' }), 'Enqueued songs');
	})
});
