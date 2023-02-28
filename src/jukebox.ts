import { AudioPlayer, AudioPlayerError, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { Logger } from "pino";
import convertURIToAudioResource from "./helpers/getAudioResourceFromURI";
import { Tonelist } from "./tonelist";
import { EventEmitter } from "events";

type JukeboxArguments = {
	tonelist: Tonelist,
	channel: VoiceChannel
	leaveChannelTimeoutTime?: number
}

export class Jukebox extends EventEmitter {
	connection: VoiceConnection;
	player: AudioPlayer;
	queue: string[] = [];
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

		// this.player.on(AudioPlayerStatus.Buffering, this.onPlayerBuffering.bind(this));
		// this.player.on(AudioPlayerStatus.Playing, this.onPlayerPlaying.bind(this));
		// this.player.on(AudioPlayerStatus.Paused, this.onPlayerPaused.bind(this));
		// this.player.on(AudioPlayerStatus.AutoPaused, this.onPlayerAutoPaused.bind(this));

		// this.connection.on(VoiceConnectionStatus.Signalling, this.onConnectionSignalling.bind(this));
		// this.connection.on(VoiceConnectionStatus.Connecting, this.onConnectionConnecting.bind(this));
		// this.connection.on(VoiceConnectionStatus.Ready, this.onConnectionReady.bind(this));
		// this.connection.on(VoiceConnectionStatus.Disconnected, this.onConnectionDisconnected.bind(this));
		// this.connection.on(VoiceConnectionStatus.Destroyed, this.onConnectionDestroyed.bind(this));

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
		await this.playNext();
	}

	private async playNext() {
		// check if player is idle and not fetching audio resource
		if (this.player.state.status !== AudioPlayerStatus.Idle || this.fetchingAudioResource) {
			return;
		}

		const songURI = this.queue.shift();

		if (!songURI) {
			if (this.leaveChannelTimeout) {
				clearTimeout(this.leaveChannelTimeout);
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

		if (this.leaveChannelTimeout) {
			clearTimeout(this.leaveChannelTimeout);
			this.leaveChannelTimeout = null;
		}

		this.logger.info(`Playing ${songURI}`);

		this.fetchingAudioResource = true;
		const audioResource = await convertURIToAudioResource(songURI);
		this.fetchingAudioResource = false;
		this.player.play(audioResource);
	}

	private onPlayerIdle() {
		this.playNext();
	}

	private onPlayerError(error: AudioPlayerError) {
		this.logger.error(error);
	}

	private onConnectionError() {
		this.logger.info('Connection error');
	}
}
