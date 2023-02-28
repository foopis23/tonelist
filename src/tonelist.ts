import { Client, GatewayIntentBits } from "discord.js";
import pino, { Logger } from "pino";
import { BaseArgument, EnqueueArgument, FlushArgument, SkipArgument, TonelistConfig, TonelistErrors } from "./types";
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
			const jukebox = new Jukebox({
				tonelist: this,
				channel
			});

			this.guildJukeboxes.set(guildID, jukebox);

			jukebox.on('exit', () => {
				jukebox.removeAllListeners();
				this.guildJukeboxes.delete(guildID);
			})
		}

		// get jukebox
		const jukebox = this.guildJukeboxes.get(guildID);

		// if jukebox is not playing to the requested channel, throw error
		if (jukebox?.connection.joinConfig.channelId !== channel.id) {
			throw new Error(TonelistErrors.JukeboxInUseInDifferentChannel);
		}

		// enqueue song
		return await jukebox.enqueue(argument.songURI);
	}

	public async skip(argument: SkipArgument) {
		const jukebox = await this.getJukebox(argument);
		return await jukebox.next();
	}

	public async previous(argument: SkipArgument) {
		const jukebox = await this.getJukebox(argument);
		return await jukebox.previous();
	}

	public async flush(argument: FlushArgument) {
		const jukebox = await this.getJukebox(argument);
		return jukebox.flush();
	}

	public async getQueue(argument: BaseArgument) {
		const jukebox = await this.getJukebox(argument);
		return jukebox.getQueue();
	}

	private async getJukebox(argument: BaseArgument) {
		const channel = await getVoiceChannel(this.client, {
			channel: argument.channel,
		});

		if (!this.guildJukeboxes.has(channel.guild.id)) {
			throw new Error(TonelistErrors.BotNotInVoiceChannel);
		}

		const guildID = channel.guild.id;
		const jukebox = this.guildJukeboxes.get(guildID) as Jukebox;

		if (jukebox.connection.joinConfig.channelId !== channel.id) {
			throw new Error(TonelistErrors.JukeboxInUseInDifferentChannel);
		}

		return jukebox;
	}
}

const tonelist = new Tonelist();

export default tonelist;