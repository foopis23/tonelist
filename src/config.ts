import { OptionValues } from "commander";
import { TonelistConfig } from "./types";

const REQUIRED_OPTIONS = [
	'token',
	'logLevel',
	'mongoUri'
]

const OPTIONS = [
	...REQUIRED_OPTIONS
]

const OPTION_TYPES: Record<string, string> = {
	token: 'string',
	logLevel: 'string',
	mongoUri: 'string'
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

function convertEnvVarType(value: string, type: string) {
	if (type === 'boolean') {
		return value === 'true';
	}

	if (type === 'number') {
		return Number(value);
	}

	return value;
}

function getEnvVariables() {
	const envVars: Record<string, string | boolean | number> = {};

	for (const option of OPTIONS) {
		const envVar = toCaps(option);

		if (process.env[envVar]) {
			envVars[option] = convertEnvVarType((process.env as Record<string, string>)[envVar], OPTION_TYPES[option]);
		}
	}

	return envVars;
}

function getConfig(options: OptionValues): TonelistConfig {
	const envVars = getEnvVariables();

	const config = {
		...envVars,
		...options
	};

	validateConfig(config);

	return config as TonelistConfig;
}

export default getConfig;