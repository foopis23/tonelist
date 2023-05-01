import { Channel, Client, ClientOptions, GatewayDispatchEvents, GatewayIntentBits, Guild, TextChannel } from "discord.js";
import pino, { Logger, LoggerOptions } from "pino";
import { ConnectionInfo, Node } from "lavaclient";
import { Queue, TypedError, ErrorTypes, TonelistTrack } from "./types";
import { MemoryStore, Store } from "@foopis23/ts-store";
import { getItem } from "./util/discord-cache";
import { InitCommandOptions } from "./interactions/types";
import ytdl from "ytdl-core";

export type JoinArguments = {
	guildId: string;
	textChannelId?: string;
	voiceChannelId: string;
}

export type LeaveArguments = {
	guildId: string;
}

export type EnqueueArguments = {
	guildId: string;
	voiceChannelId: string;
	textChannelId?: string;
	query: string;
}

export type RemoveArguments = {
	guildId: string;
	index: number;
}

export type QueueArguments = {
	guildId: string;
}

export type SkipArguments = {
	guildId: string;
}

export type InitOptions = {
	loggerOptions?: LoggerOptions;
	clientOptions?: Partial<ClientOptions>;
	commandOptions?: Partial<InitCommandOptions>;
	token: string;
	clientId: string;
	lavaConnectionInfo: ConnectionInfo;
	store?: Store<Queue>;
}

export class Tonelist {
	logger: Logger;
	client: Client;
	node: Node;
	queues: Store<Queue>
	listeners: Store<{ id: string }>

	async init(options: InitOptions, ready?: (client: Client) => void) {
		this.logger = pino({
			name: 'Tonelist',
			level: 'info',
			...options.loggerOptions
		});

		this.client = new Client({
			...options.clientOptions ?? {},
			intents: options.clientOptions?.intents ?? [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildVoiceStates
			],
		});

		this.node = new Node({
			sendGatewayPayload: (id, payload) => this.client.guilds.cache.get(id)?.shard?.send(payload),
			connection: options.lavaConnectionInfo,
		});
		this.client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, data => this.node.handleVoiceUpdate(data));
		this.client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, data => this.node.handleVoiceUpdate(data));

		const onReady = (function (client: Client) {
			client.removeListener('ready', onReady);
			this.node.connect(client.user.id);
			ready?.(client);
		}).bind(this);
		this.client.on('ready', onReady);

		this.queues = options.store ?? new MemoryStore<Queue>();
		this.listeners = new MemoryStore<{ id: string }>();

		this.client.login(options.token);
		return this;
	}

	async findQueue(guildId: string) {
		const queue = await this.queues.get(guildId);
		if (!queue || !queue.value) {
			throw new TypedError(ErrorTypes.QUEUE_NOT_FOUND);
		}
		return queue.value;
	}

	async findOrCreateQueue(guildId: string) {
		try {
			return await this.findQueue(guildId)
		} catch (e) {
			await this.queues.set(guildId, {
				tracks: []
			});

			return await this.findQueue(guildId);
		}
	}

	async getGuild(guildId: string) {
		const guild = await getItem<Guild>(this.client.guilds, guildId);
		if (!guild) {
			throw new TypedError(ErrorTypes.GUILD_NOT_FOUND);
		}
		return guild;
	}

	async getChannel(guildId: string, channelId: string) {
		const guild = await this.getGuild(guildId);
		const channel = await getItem<Channel>(guild.channels, channelId);

		if (!channel) {
			throw new TypedError(ErrorTypes.CHANNEL_NOT_FOUND);
		}

		return channel;
	}

	getCurrentTrack(guildId: string): TonelistTrack | null {
		if (!this.node.players.has(guildId)) {
			return null;
		}
		
		const player = this.node.players.get(guildId);

		if (!player || !player.track) {
			return null;
		}

		return {
			track: player.track,
			info: player.trackData,
			accuratePosition: player.accuratePosition,
		};
	}

	private createPlayer(guildId: string) {
		const player = this.node.createPlayer(guildId);
		player.on('trackEnd', async () => {
			await this.playNext(guildId);
		});

		return player;
	}

	private async playNext(guildId: string) {
		const queue = await this.findOrCreateQueue(guildId);
		const player = this.node.players.get(guildId);

		if (queue.tracks.length < 1) {
			player.disconnect();
			this.node.destroyPlayer(player.guildId);
			await this.queues.destroy(guildId);
			return;
		}

		const trackToPlay = queue.tracks.shift();

		await this.queues.set(guildId, queue);
		await player.play(trackToPlay.track);

		if (queue.textChannel) {
			const channel = await this.getChannel(guildId, queue.textChannel);

			if (channel.isTextBased()) {
				await (channel as TextChannel).send(`Now playing \`${trackToPlay.info.title}\``);
			}
		}
	}

	findOrCreatePlayer(guildId: string) {
		let player = this.node.players.get(guildId);
		if (!player) {
			player = this.createPlayer(guildId);
		}

		return player;
	}

	async join(args: JoinArguments) {
		const { guildId, textChannelId, voiceChannelId } = args;

		const player = this.findOrCreatePlayer(guildId);

		if (player.connected) {
			throw new TypedError(ErrorTypes.ALREADY_CONNECTED);
		}

		const queue = await this.findOrCreateQueue(guildId);

		if (textChannelId) {
			await this.queues.set(guildId, queue);
		}

		player.connect(voiceChannelId, { deafened: true });

		if (!player.playing) {
			await player.play(queue.tracks[0].track);
		}

		return {
			queue,
			guildId,
			textChannelId,
			voiceChannelId
		};
	}

	async leave(args: LeaveArguments) {
		const { guildId } = args;

		const player = this.node.players.get(guildId);

		if (!player.connected) {
			throw new TypedError(ErrorTypes.NOT_CONNECTED);
		}

		const voiceChannel = await this.getChannel(guildId, player.channelId);

		player.disconnect();
		this.node.destroyPlayer(player.guildId);

		return {
			guildId,
			voiceChannelId: voiceChannel.id
		};
	}

	async enqueue(args: EnqueueArguments) {
		const { guildId, voiceChannelId, query } = args;

		const player = this.findOrCreatePlayer(guildId);
		const tracks = await this.node.rest.loadTracks(query);

		if (tracks.loadType === "NO_MATCHES") {
			throw new TypedError(ErrorTypes.NO_MATCHES);
		}

		if (tracks.loadType === "LOAD_FAILED") {
			throw new TypedError(ErrorTypes.LOAD_FAILED);
		}

		const tracksWithThumbnails: TonelistTrack[] = await Promise.all(
			tracks.tracks.map(async track => {
				if (!track.info.uri || !ytdl.validateURL(track.info.uri)) {
					return track;
				}

				const info = await ytdl.getInfo(track.info.uri);

				return {
					...track,
					thumbnail: info.videoDetails.thumbnails
				}
			})
		);

		if (!player?.connected) {
			player.connect(voiceChannelId, { deafened: true });
		}

		const queue = await this.findOrCreateQueue(guildId);
		queue.tracks.push(...tracksWithThumbnails);

		if (!queue.textChannel && args.textChannelId) {
			queue.textChannel = args.textChannelId;
		}

		await this.queues.set(guildId, queue);

		const started = player.playing || player.paused;
		if (!started) {
			await this.playNext(guildId)
		}

		return {
			queue,
			guildID: guildId,
			voiceChannelId,
			loadType: tracks.loadType,
		}
	}

	async remove(args: RemoveArguments) {
		const { guildId, index } = args;

		const queue = await this.findOrCreateQueue(guildId);

		if (index < 0 || index >= queue.tracks.length) {
			throw new TypedError(ErrorTypes.INVALID_INDEX);
		}

		const removedTracks = queue.tracks.splice(index, 1);
		await this.queues.set(guildId, queue);


		return {
			queue,
			guildId,
			removedTrack: removedTracks[0]
		};
	}

	async queue(args: QueueArguments) {
		const { guildId } = args;

		return {
			queue: await this.findOrCreateQueue(guildId),
			guildId
		};
	}

	async skip(args: SkipArguments) {
		const { guildId } = args;
		const player = this.node.players.get(guildId);
		const currentTrack = player.trackData;

		await player.stop();

		return {
			queue: await this.findOrCreateQueue(guildId),
			guildId,
			skipped: currentTrack
		};
	}
}

const tonelist = new Tonelist();
export default tonelist;