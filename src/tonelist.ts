import { Client, GatewayDispatchEvents, GatewayIntentBits } from "discord.js";
import pino, { Logger } from "pino";
import { Node } from "lavaclient";
import { InitOptions } from "./types";

class BaseTonelist {
	logger: Logger;
	client: Client;
	node: Node;

	async init(options: InitOptions) {
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

		const connectPromise = new Promise<void>((resolve) => {
			const onReady = (function (client: Client) {
				client.removeListener('ready', onReady);
				try {
					this.node.connect(client.user.id);
				} catch (e) {
					this.node.connect(client.user.id);
				}
				resolve();
			}).bind(this);

			this.client.on('ready', onReady);
		})

		this.client.login(options.token);
		await connectPromise;

		return this;
	}
}

export class Tonelist extends BaseTonelist {
	async init(options: InitOptions) {
		await super.init(options);

		const results = await this.node.rest.loadTracks('ytsearch: tatsuro yamashita for you')

		await this.node
			.createPlayer('637502626120073218')
			.connect('711959134626644018')
			.play(results.tracks[0].track);

		return this;
	}
}

const tonelist = new Tonelist();
export default tonelist;