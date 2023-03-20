import { Client, GatewayDispatchEvents, GatewayIntentBits } from "discord.js";
import pino, { Logger } from "pino";
import { Node } from "lavaclient";
import { EnqueueArguments, InitOptions, JoinArguments, LeaveArguments, Queue, QueueArguments, RemoveArguments, TonelistError, TonelistErrorType } from "./types";
import { Store, StoreErrorType } from "./store/types";
import InMemoryStore from "./store/in-memory-store";
import initCommands from "./commands/init";

class BaseTonelist {
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

		this.queues = new InMemoryStore();

		this.client.login(options.token);
		return this;
	}

	async findOrCreateQueue(guildId: string) {
		let queue: Queue;

		try {
			queue = await this.queues.get(guildId)
		} catch (e) {
			if (e.type === StoreErrorType.NOT_FOUND) {
				// handles queue does not exist error
				queue = {
					tracks: []
				};

				await this.queues.set(guildId, queue);
			} else {
				throw e;
			}
		}

		return queue;
	}

	async getGuild(guildId: string) {
		const guild = this.client.guilds.cache.get(guildId);
		if (!guild) {
			const freshGuild = await this.client.guilds.fetch(guildId);
			if (!freshGuild) {
				throw new Error('Guild not found');
			}

			return freshGuild;
		}

		return guild;
	}

	async getVoiceChannel(guildId: string, channelId: string) {
		const guild = await this.getGuild(guildId);
		const channel = guild.channels.cache.get(channelId);
		if (!channel) {
			const freshChannel = await guild.channels.fetch(channelId);
			if (!freshChannel) {
				throw new Error('Channel not found');
			}

			return freshChannel;
		}

		return channel;
	}

	createPlayer(guildId: string) {
		const player = this.node.createPlayer(guildId);
		player.on('trackEnd', async () => {
			const queue = await this.findOrCreateQueue(guildId);
			queue.tracks.shift();
			await this.queues.set(guildId, queue);

			if (queue.tracks.length) {
				await player.play(queue.tracks[0].track);
			} else {
				player.disconnect();
				this.node.destroyPlayer(player.guildId);
			}
		});

		return player;
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
			throw new TonelistError('Already connected to a voice channel', TonelistErrorType.ALREADY_CONNECTED);
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
			throw new TonelistError('Not connected to a voice channel', TonelistErrorType.NOT_CONNECTED);
		}

		const voiceChannel = await this.getVoiceChannel(guildId, player.channelId);

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

		const queue = await this.findOrCreateQueue(guildId);

		if (index < 0 || index >= queue.tracks.length) {
			queue.tracks.splice(index, 1);
		} else {
			throw new TonelistError('Index out of bounds', TonelistErrorType.INDEX_OUT_OF_BOUNDS);
		}

		await this.queues.set(guildId, queue);

		return {
			queue,
			guildId
		};
	}

	async queue(args: QueueArguments) {
		const { guildId } = args;

		return {
			queue: await this.findOrCreateQueue(guildId),
			guildId
		};
	}
}

export class Tonelist extends BaseTonelist {
	async init(options: InitOptions, ready?: (client: Client) => void) {
		await super.init(
			options,
			async () => {
				await initCommands(this, {
					...options?.commandOptions ?? {}
				})
				ready?.(this.client);
			}
		);

		return this;
	}
}

const tonelist = new Tonelist();
export default tonelist;