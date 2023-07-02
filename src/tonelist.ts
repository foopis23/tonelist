import { Channel, Client, ClientOptions, GatewayDispatchEvents, GatewayIntentBits, Guild, TextChannel } from "discord.js";
import pino, { Logger, LoggerOptions } from "pino";
import { ConnectionInfo, Node } from "lavaclient";
import { Queue, TypedError, ErrorTypes } from "./types";
import { MemoryStore, Store } from "@foopis23/ts-store";
import { getItem } from "./util/discord-cache";
import { InitCommandOptions } from "./interactions/types";

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

export type ShuffleArguments = {
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

	private createPlayer(guildId: string) {
		const player = this.node.createPlayer(guildId);
		player.on('trackEnd', async () => {
			await this.playNext(guildId);
		});

		return player;
	}

	private async playNext(guildId: string) {
		const queue = await this.findOrCreateQueue(guildId);
		queue.tracks.shift();

		const player = this.node.players.get(guildId);

		if (queue.tracks.length < 1) {
			player.disconnect();
			this.node.destroyPlayer(player.guildId);
			await this.queues.destroy(guildId);
		} else {
			await this.queues.set(guildId, queue);
			await player.play(queue.tracks[0].track);

			if (queue.textChannel) {
				const channel = await this.getChannel(guildId, queue.textChannel);

				if (channel.isTextBased()) {
					await (channel as TextChannel).send(`Now playing \`${queue.tracks[0].info.title}\``);
				}
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

		if (!player?.connected) {
			player.connect(voiceChannelId, { deafened: true });
		}

		const queue = await this.findOrCreateQueue(guildId);
		queue.tracks.push(...tracks.tracks);

		if (!queue.textChannel && args.textChannelId) {
			queue.textChannel = args.textChannelId;
		}

		await this.queues.set(guildId, queue);

		const started = player.playing || player.paused;
		if (!started) {
			await player.play(queue.tracks[0].track);
		}

		return {
			queue,
			guildID: guildId,
			voiceChannelId
		}
	}

	async remove(args: RemoveArguments) {
		const { guildId, index } = args;

		if (index == 0) {
			throw new TypedError(ErrorTypes.CANNOT_REMOVE_CURRENT);
		}

		const queue = await this.findOrCreateQueue(guildId);

		if (index < 1 || index >= queue.tracks.length) {
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

	async shuffle(args: ShuffleArguments) {
		const { guildId } = args;
		const queue = await this.findOrCreateQueue(guildId);

		const currentTrack = queue.tracks.shift();

		for (let i = queue.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
		}

		queue.tracks.unshift(currentTrack);

		await this.queues.set(guildId, queue);

		return {
			queue,
			guildId
		};
	}
}

const tonelist = new Tonelist();
export default tonelist;