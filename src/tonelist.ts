import { Channel, Client, GatewayDispatchEvents, GatewayIntentBits, Guild, TextChannel } from "discord.js";
import pino, { Logger } from "pino";
import { Node } from "lavaclient";
import { EnqueueArguments, InitOptions, JoinArguments, LeaveArguments, Queue, QueueArguments, RemoveArguments, SkipArguments, TonelistError, TonelistErrorType } from "./types";
import { MemoryStore, Store } from "@foopis23/ts-store";
import { getItem } from "./util";

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
			throw new Error('Queue not found');
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
			throw new Error('Guild not found');
		}
		return guild;
	}

	async getChannel(guildId: string, channelId: string) {
		const guild = await this.getGuild(guildId);
		const channel = await getItem<Channel>(guild.channels, channelId);

		if (!channel) {
			throw new Error('Channel not found');
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
			throw new TonelistError('Cannot remove the currently playing track', TonelistErrorType.CANNOT_REMOVE_CURRENT);
		}

		const queue = await this.findOrCreateQueue(guildId);

		if (index < 0 || index >= queue.tracks.length) {
			throw new TonelistError('Index out of bounds', TonelistErrorType.INDEX_OUT_OF_BOUNDS);
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