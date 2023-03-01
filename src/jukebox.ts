import { AudioPlayer, AudioPlayerError, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { Logger } from "pino";
import convertURIToAudioResource from "./voice/getAudioResourceFromURI";
import { Tonelist } from "./tonelist";
import { EventEmitter } from "events";
import { TonelistErrors } from "./types";
import QueueModel from "./db/queue";

type JukeboxArguments = {
	tonelist: Tonelist,
	channel: VoiceChannel
	leaveChannelTimeoutTime?: number
}

export class Jukebox extends EventEmitter {
	connection: VoiceConnection;
	player: AudioPlayer;
	leaveChannelTimeoutTime: number;

	private leaveChannelTimeout: NodeJS.Timeout | null = null;
	private fetchingAudioResource = false;
	private logger: Logger;

	constructor(args: JukeboxArguments) {
		super();
		const { tonelist, channel } = args;

		this.logger = tonelist.logger.child({ name: 'Jukebox', guildID: channel.guild.id, channelID: channel.id })
		this.leaveChannelTimeoutTime = args.leaveChannelTimeoutTime || 1000 * 60 * 5;

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});
		this.player = createAudioPlayer();
		this.connection.subscribe(this.player);

		this.connection.on('error', this.onConnectionError.bind(this));

		this.player.on(AudioPlayerStatus.Idle, this.onPlayerIdle.bind(this));
		this.player.on('error', this.onPlayerError.bind(this));

		this.connection.on('stateChange', (oldState, newState) => {
			this.logger.debug(`Voice connection state changed from ${oldState.status} to ${newState.status}`);
		});

		this.player.on('stateChange', (oldState, newState) => {
			this.logger.debug(`Audio player state changed from ${oldState.status} to ${newState.status}`);
		});
	}

	public async enqueue(songURI: string) {
		const queue = await this.findOrCreateQueue();
		this.logger.info(`Enqueuing ${songURI}`);
		queue.queue.push(songURI);

		if (this.player.state.status === AudioPlayerStatus.Idle && !this.fetchingAudioResource) {
			await this.next();
		}

		await queue.save();
	}

	public async next() {
		this.logger.info('Playing next song');
		const queue = await this.findOrCreateQueue();

		if (queue.queuePosition + 1 >= queue.queue.length) {
			if (this.leaveChannelTimeout) {
				return;
			}

			this.logger.info('No more songs in queue');
			this.leaveChannelTimeout = setTimeout(() => {
				this.player.stop();
				this.connection.destroy();

				this.player.removeAllListeners();
				this.connection.removeAllListeners();

				this.emit('exit');
				this.leaveChannelTimeout = null;
			}, this.leaveChannelTimeoutTime);

			return;
		}

		queue.queuePosition++;

		if (this.leaveChannelTimeout) {
			clearTimeout(this.leaveChannelTimeout);
			this.leaveChannelTimeout = null;
		}

		const songURI = queue.queue[queue.queuePosition];
		await Promise.all([
			this.playSong(songURI),
			queue.save()
		]);
	}

	public async previous() {
		this.logger.info('Playing previous song');
		const queue = await this.findOrCreateQueue();

		if (queue.queuePosition - 1 < 0) {
			throw new Error(TonelistErrors.NoPreviousSong);
		}

		queue.queuePosition--;

		const songURI = queue.queue[queue.queuePosition];
		await Promise.all([
			this.playSong(songURI),
			queue.save(),
		]);
	}

	public async resume() {
		this.logger.info('Resuming song');
		const queue = await this.findOrCreateQueue();
		const songURI = queue.queue[queue.queuePosition];
		await this.playSong(songURI);
	}

	public async flush() {
		this.logger.info('Flushing queue');
		await QueueModel.updateOne(
			{ id: this.connection.joinConfig.guildId },
			{ queue: [], queuePosition: -1 }
		);

		this.player.stop();
	}

	public async getQueue() {
		this.logger.info('Getting queue');
		const queue = await this.findOrCreateQueue();

		if (!queue) {
			return null;
		}

		return {
			songs: queue?.queue || [],
			pointer: queue?.queuePosition || -1,
		}
	}

	private async playSong(songURI: string) {
		this.logger.info(`Playing ${songURI}`);

		this.fetchingAudioResource = true;
		const audioResource = await convertURIToAudioResource(songURI);
		this.fetchingAudioResource = false;
		this.player.play(audioResource);
	}

	private async findOrCreateQueue() {
		const queue = await QueueModel.findById(this.connection.joinConfig.guildId);

		if (queue) {
			return queue;
		}

		return await QueueModel.create({
			_id: this.connection.joinConfig.guildId,
			queue: [],
			queuePosition: -1,
			channelID: this.connection.joinConfig.channelId,
		})
	}

	private onPlayerIdle() {
		this.logger.info('Player idle');
		if (!this.fetchingAudioResource) {
			this.next();
		}
	}

	private onPlayerError(error: AudioPlayerError) {
		this.logger.error(error);
		this.next();
	}

	private onConnectionError() {
		this.logger.info('Connection error');
	}
}
