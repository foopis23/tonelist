import { createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { Client, GatewayIntentBits, Channel, VoiceChannel } from "discord.js";
import pino, { Logger } from "pino";
import { EnqueueArgument, TonelistConfig } from "./types";
import fs from 'fs';

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

	private async getVoiceChannel(channel: string | Channel): Promise<VoiceChannel> {
		const fetchedChannel = typeof channel === 'string' ? await this.client.channels.fetch(channel) : channel;

		if (!fetchedChannel) {
			throw new Error('Invalid channel');
		}

		if (!fetchedChannel.isVoiceBased()) {
			throw new Error('Channel is not a voice channel');
		}

		return fetchedChannel as VoiceChannel;
	}

	private async convertURIToAudioResource(songURI: string) {
		// validate song uri is file path
		// create audio resource
		try {
			await fs.promises.access(songURI, fs.constants.R_OK)
		} catch (err) {
			throw new Error('Invalid song URI');
		}

		return createAudioResource(fs.createReadStream(songURI));
	}

	public async enqueue(argument: EnqueueArgument) {
		const channel = await this.getVoiceChannel(argument.channel);

		if (!channel.joinable) {
			throw new Error('Cannot join channel');
		}

		const audioResource = await this.convertURIToAudioResource(argument.songURI);

		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		})

		const player = createAudioPlayer();
		connection.subscribe(player);

		player.play(audioResource);
	}
}

const tonelist = new Tonelist();

export default tonelist;