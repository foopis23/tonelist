import { GatewayDispatchEvents, Client } from "discord.js";
import { ConnectionInfo, Node, NodeOptions } from "lavaclient";

type InitLavaLinkOptions = {
	nodeOptions: Partial<NodeOptions> & {
		connection: ConnectionInfo
	}
}

function initLavaClient(client: Client, options: InitLavaLinkOptions) {
	const { nodeOptions } = options;

	const lavaClient = new Node({
		...nodeOptions,
		sendGatewayPayload: (id, payload) => client.guilds.cache.get(id)?.shard?.send(payload),
	});

	client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, data => lavaClient.handleVoiceUpdate(data));
	client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, data => lavaClient.handleVoiceUpdate(data));

	return lavaClient;
}

export default initLavaClient;
