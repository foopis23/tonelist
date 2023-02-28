import { Channel, Client, VoiceChannel } from "discord.js";
import { TonelistErrors } from "./types";

async function getVoiceChannel(client: Client, args: { channel: string | Channel }): Promise<VoiceChannel> {
	const { channel } = args;
	const fetchedChannel = typeof channel === 'string' ? await client.channels.fetch(channel) : channel;

	if (!fetchedChannel) {
		throw new Error(TonelistErrors.InvalidChannel);
	}

	if (!fetchedChannel.isVoiceBased()) {
		throw new Error(TonelistErrors.InvalidChannelType);
	}

	return fetchedChannel as VoiceChannel;
}

export default getVoiceChannel;