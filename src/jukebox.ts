import { AudioPlayer, AudioPlayerError, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { Logger } from "pino";
import convertURIToAudioResource from "./helpers/getAudioResourceFromURI";
import { Tonelist } from "./tonelist";

export class Jukebox {
	connection: VoiceConnection;
	player: AudioPlayer;
	queue: string[] = [];

	private fetchingAudioResource = false;
	private tonelist: Tonelist;
	private logger: Logger;

	constructor(args: { tonelist: Tonelist, channel: VoiceChannel }) {
		const { tonelist, channel } = args;

		this.logger = tonelist.logger.child({ name: 'Jukebox', guildID: channel.guild.id, channelID: channel.id })

		this.tonelist = tonelist;

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});
		this.player = createAudioPlayer();
		this.connection.subscribe(this.player);

		// this.connection.on(VoiceConnectionStatus.Signalling, this.onConnectionSignalling.bind(this));
		// this.connection.on(VoiceConnectionStatus.Connecting, this.onConnectionConnecting.bind(this));
		// this.connection.on(VoiceConnectionStatus.Ready, this.onConnectionReady.bind(this));
		// this.connection.on(VoiceConnectionStatus.Disconnected, this.onConnectionDisconnected.bind(this));
		// this.connection.on(VoiceConnectionStatus.Destroyed, this.onConnectionDestroyed.bind(this));
		this.connection.on('error', this.onConnectionError.bind(this));

		this.player.on(AudioPlayerStatus.Idle, this.onPlayerIdle.bind(this));
		// this.player.on(AudioPlayerStatus.Buffering, this.onPlayerBuffering.bind(this));
		// this.player.on(AudioPlayerStatus.Playing, this.onPlayerPlaying.bind(this));
		// this.player.on(AudioPlayerStatus.Paused, this.onPlayerPaused.bind(this));
		// this.player.on(AudioPlayerStatus.AutoPaused, this.onPlayerAutoPaused.bind(this));
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
		await this.playNext();
	}

	private async playNext() {
		// check if player is idle and not fetching audio resource
		if (this.player.state.status !== AudioPlayerStatus.Idle || this.fetchingAudioResource) {
			return;
		}

		const songURI = this.queue.shift();

		if (!songURI) {
			this.logger.info('No more songs in queue');
			return;
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

	// private onPlayerBuffering() {

	// }

	// private onPlayerPlaying() {

	// }

	// private onPlayerPaused() {

	// }

	// private onPlayerAutoPaused() {

	// }

	private onPlayerError(error: AudioPlayerError) {
		this.logger.error(error);
	}

	// private onConnectionSignalling() {

	// }

	// private onConnectionConnecting() {

	// }

	// private onConnectionReady() {

	// }

	// private onConnectionDisconnected() {

	// }

	// private onConnectionDestroyed() {

	// }

	private onConnectionError() {
		this.logger.info('Connection error');
	}
}
