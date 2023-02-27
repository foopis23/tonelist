import { program, Option } from 'commander';
import getConfig from './config';

program
	.name('tonelist')
	.version('0.0.1', '-v, --version', 'output the current version')
	.addOption(new Option('--log-level <level>', 'set log level').choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'))
	.option('--token <token>', 'set Discord bot token');

program.parse(process.argv);

const options = program.opts();
const config = getConfig(options);

console.log(config);
