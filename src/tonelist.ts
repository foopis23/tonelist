import { Client, GatewayIntentBits } from "discord.js";
import pino, { Logger } from "pino";
import { TonelistConfig } from "./types";


export class Tonelist {
	logger!: Logger;
	client!: Client;

	init(config: TonelistConfig, callback?: (tonelist: Tonelist) => void) {
		this.logger = pino({
			level: config.logLevel,
		});

		this.logger.info('Staring Tonelist...');

		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildVoiceStates
			]
		});

		this.client.on('ready', (client) => {
			this.logger.info(`Logged in as ${client.user?.tag}!`);
			if (callback) {
				callback(this);
			}
		});

		this.logger.info('Logging in to discord...');
		this.client.login(config.token);
	}
}

const tonelist = new Tonelist();

export default tonelist;