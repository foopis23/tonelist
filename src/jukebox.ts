import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import convertURIToAudioResource from "./getAudioResourceFromURI";
import { Tonelist } from "./tonelist";

export class Jukebox {
	connection: VoiceConnection;
	player: AudioPlayer;
	queue: string[] = [];

	private fetchingAudioResource = false;
	private tonelist: Tonelist;

	constructor(args: { tonelist: Tonelist, channel: VoiceChannel }) {
		const { tonelist, channel } = args;

		this.tonelist = tonelist;

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});
		this.player = createAudioPlayer();
		this.connection.subscribe(this.player);

		this.connection.on(VoiceConnectionStatus.Signalling, this.onConnectionSignalling.bind(this));
		this.connection.on(VoiceConnectionStatus.Connecting, this.onConnectionConnecting.bind(this));
		this.connection.on(VoiceConnectionStatus.Ready, this.onConnectionReady.bind(this));
		this.connection.on(VoiceConnectionStatus.Disconnected, this.onConnectionDisconnected.bind(this));
		this.connection.on(VoiceConnectionStatus.Destroyed, this.onConnectionDestroyed.bind(this));
		this.connection.on('error', this.onConnectionError.bind(this));

		this.player.on(AudioPlayerStatus.Idle, this.onPlayerIdle.bind(this));
		this.player.on(AudioPlayerStatus.Buffering, this.onPlayerBuffering.bind(this));
		this.player.on(AudioPlayerStatus.Playing, this.onPlayerPlaying.bind(this));
		this.player.on(AudioPlayerStatus.Paused, this.onPlayerPaused.bind(this));
		this.player.on(AudioPlayerStatus.AutoPaused, this.onPlayerAutoPaused.bind(this));
		this.player.on('error', this.onPlayerError.bind(this));
	}

	public async enqueue(songURI: string) {
		this.tonelist.logger.info(`Enqueuing ${songURI}`);
		this.queue.push(songURI);
		await this.playNext();
	}

	private async playNext() {
		// check if player is idle and not fetching audio resource
		if (this.player.state.status !== AudioPlayerStatus.Idle || this.fetchingAudioResource) {
			return;
		}

		this.tonelist.logger.info('Playing next song');

		const songURI = this.queue.shift();

		if (!songURI) {
			return;
		}

		this.fetchingAudioResource = true;
		const audioResource = await convertURIToAudioResource(songURI);
		this.fetchingAudioResource = false;
		this.player.play(audioResource);
	}

	private onPlayerIdle() {
		this.tonelist.logger.info('Player is idle');
		this.playNext();
	}

	private onPlayerBuffering() {
		this.tonelist.logger.info('Player is buffering');
	}

	private onPlayerPlaying() {
		this.tonelist.logger.info('Player is playing');
	}

	private onPlayerPaused() {
		this.tonelist.logger.info('Player is paused');
	}

	private onPlayerAutoPaused() {
		this.tonelist.logger.info('Player is auto paused');
	}

	private onPlayerError() {
		this.tonelist.logger.info('Player error');
	}

	private onConnectionSignalling() {
		this.tonelist.logger.info('Connection is signalling');
	}

	private onConnectionConnecting() {
		this.tonelist.logger.info('Connection is connecting');
	}

	private onConnectionReady() {
		this.tonelist.logger.info('Connection is ready');
	}

	private onConnectionDisconnected() {
		this.tonelist.logger.info('Connection is disconnected');
	}

	private onConnectionDestroyed() {
		this.tonelist.logger.info('Connection is destroyed');
	}

	private onConnectionError() {
		this.tonelist.logger.info('Connection error');
	}
}
