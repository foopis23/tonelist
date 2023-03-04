import { Client, GatewayIntentBits, VoiceChannel } from "discord.js";
import pino, { Logger } from "pino";
import { BaseArgument, EnqueueArgument, FlushArgument, RemoveArgument, SkipArgument, TonelistConfig, TonelistErrors } from "./types";
import getVoiceChannel from "./voice/getVoiceChannel";
import { Jukebox } from "./jukebox";
import initDB from "./db";
import QueueModel from "./db/queue";
import initCommands from "./commands/initCommand";

export class Tonelist {
	logger!: Logger;
	client!: Client;
	guildJukeboxes: Map<string, Jukebox>;

	constructor() {
		this.guildJukeboxes = new Map();
	}

	async init(config: TonelistConfig, callback?: (tonelist: Tonelist) => void) {
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

		this.client.on('ready', async (client) => {
			this.logger.info(`Logged in as ${client.user?.tag}!`);

			await initCommands({
				token: config.token,
				clientId: config.clientId,
				useTestGuilds: config.useTestGuilds,
				testGuilds: config.testGuilds,
				tonelist: this,
			})

			// restore unfinished queues
			const queues = await QueueModel.find({
				$where: "this.queuePosition < this.queue.length"
			});

			for (const queue of queues) {
				if (queue.queue.length > 0) {
					try {
						const channel = await getVoiceChannel(this.client, {
							channel: queue.channelID
						});

						const jukebox = await this.getOrCreateJukebox(channel);
						await jukebox.resume();
					} catch (error) {
						this.logger.error(error);
					}
				}
			}

			if (callback) {
				callback(this);
			}
		});

		await initDB(config)

		this.logger.info('Logging in to discord...');
		await this.client.login(config.token);
	}

	public async enqueue(argument: EnqueueArgument) {
		// get channel to enqueue in
		const channel = await getVoiceChannel(this.client, {
			channel: argument.channel,
		});

		// check if jukebox is jukebox needed to be created
		const jukebox = await this.getOrCreateJukebox(channel);

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
		return await jukebox.flush();
	}

	public async remove(argument: RemoveArgument) {
		const jukebox = await this.getJukebox(argument);
		return await jukebox.remove(argument.position);
	}

	public async getQueue(argument: BaseArgument) {
		const jukebox = await this.getJukebox(argument);
		return await jukebox.getQueue();
	}

	private async getJukebox(argument: BaseArgument) {
		const channel = await getVoiceChannel(this.client, {
			channel: argument.channel,
		});

		this.logger.debug({ channel: channel.id, guild: channel.guild.id, jukeboxes: Array.from(this.guildJukeboxes.keys()) }, 'getJukebox');

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

	private async getOrCreateJukebox(channel: VoiceChannel) {
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

			return jukebox;
		}

		return this.guildJukeboxes.get(guildID) as Jukebox;
	}
}

const tonelist = new Tonelist();

export default tonelist;
