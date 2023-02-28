import { AudioPlayer, AudioPlayerError, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { Logger } from "pino";
import convertURIToAudioResource from "./helpers/getAudioResourceFromURI";
import { Tonelist } from "./tonelist";
import { EventEmitter } from "events";
import { TonelistErrors } from "./types";

type JukeboxArguments = {
	tonelist: Tonelist,
	channel: VoiceChannel
	leaveChannelTimeoutTime?: number
}

export class Jukebox extends EventEmitter {
	connection: VoiceConnection;
	player: AudioPlayer;
	queue: string[] = [];
	queuePosition = -1;
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
		this.logger.info(`Enqueuing ${songURI}`);
		this.queue.push(songURI);

		if (this.player.state.status === AudioPlayerStatus.Idle && !this.fetchingAudioResource) {
			await this.next();
		}
	}

	public async next() {
		if (this.queuePosition + 1 >= this.queue.length) {
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

		this.queuePosition++;

		if (this.leaveChannelTimeout) {
			clearTimeout(this.leaveChannelTimeout);
			this.leaveChannelTimeout = null;
		}

		const songURI = this.queue[this.queuePosition];

		this.logger.info(`Playing ${songURI}`);
		this.fetchingAudioResource = true;
		const audioResource = await convertURIToAudioResource(songURI);
		this.fetchingAudioResource = false;
		this.player.play(audioResource);
	}

	public async previous() {
		if (this.queuePosition - 1 < 0) {
			throw new Error(TonelistErrors.NoPreviousSong);
		}

		this.queuePosition--;

		const songURI = this.queue[this.queuePosition];

		if (!songURI) {
			this.logger.info('No more songs in history');
			return;
		}

		this.logger.info(`Playing ${songURI}`);

		this.fetchingAudioResource = true;
		const audioResource = await convertURIToAudioResource(songURI);
		this.fetchingAudioResource = false;
		this.player.play(audioResource);
	}

	public flush() {
		this.queue = [];
		this.queuePosition = -1;
		this.player.stop();
	}

	private onPlayerIdle() {
		this.next();
	}

	private onPlayerError(error: AudioPlayerError) {
		this.logger.error(error);
		this.next();
	}

	private onConnectionError() {
		this.logger.info('Connection error');
	}
}
