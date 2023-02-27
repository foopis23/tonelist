import { OptionValues } from "commander";
import { TonelistConfig } from "./types";

const REQUIRED_OPTIONS = [
	'token',
	'logLevel'
]

const OPTION_TYPES: Record<string, string> = {
	token: 'string',
	logLevel: 'string'
}

function toCaps(str: string) {
	return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toUpperCase();
}

function kebabCase(str: string) {
	return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function validateConfig(config: OptionValues) {
	for (const option of REQUIRED_OPTIONS) {
		if (!config[option]) {
			throw new Error(`Missing required option: ${option}. Use --${kebabCase(option)} or set the ${toCaps(option)} environment variable.`);
		}

		if (typeof config[option] !== OPTION_TYPES[option]) {
			throw new Error(`Invalid type for option: ${option}. Expected ${OPTION_TYPES[option]}, got ${typeof config[option]}.`);
		}
	}
}

function getConfig(options: OptionValues): TonelistConfig {
	const config = {
		logLevel: options.logLevel,
		token: options.token ?? process.env.TOKEN
	};

	validateConfig(config);

	return config;
}

export default getConfig;