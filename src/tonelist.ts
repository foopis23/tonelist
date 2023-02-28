import { Client, GatewayIntentBits } from "discord.js";
import pino, { Logger } from "pino";
import { EnqueueArgument, TonelistConfig, TonelistErrors } from "./types";
import getVoiceChannel from "./helpers/getVoiceChannel";
import { Jukebox } from "./jukebox";

export class Tonelist {
	logger!: Logger;
	client!: Client;
	guildJukeboxes: Map<string, Jukebox>;

	constructor() {
		this.guildJukeboxes = new Map();
	}

	init(config: TonelistConfig, callback?: (tonelist: Tonelist) => void) {
		this.logger = pino({
			name: 'Tonelist',
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

	public async enqueue(argument: EnqueueArgument) {
		// get channel to enqueue in
		const channel = await getVoiceChannel(this.client, {
			channel: argument.channel,
		});

		// check if jukebox is jukebox needed to be created
		const guildID = channel.guild.id;
		if (!this.guildJukeboxes.has(guildID)) {
			this.guildJukeboxes.set(guildID, new Jukebox({
				tonelist: this,
				channel,
			}));
		}

		// get jukebox
		const jukebox = this.guildJukeboxes.get(guildID);

		// if jukebox is not playing to the requested channel, throw error
		if (jukebox?.connection.joinConfig.channelId !== channel.id) {
			throw new Error(TonelistErrors.JukeboxInUseInDifferentChannel);
		}

		// enqueue song
		jukebox.enqueue(argument.songURI);
	}
}

const tonelist = new Tonelist();

export default tonelist;