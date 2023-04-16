import { ErrorTypes, TypedError } from "../types";
import { APIParamLocation, CommandConfig } from "./types";

export const enqueue: CommandConfig = {
	summary: 'Enqueue a song',
	args: {
		guildId: { type: 'string', required: true, command: false, api: APIParamLocation.PATH, summary: 'The id of the discord server' },
		voiceChannelId: { type: 'string', required: true, command: false, api: APIParamLocation.BODY, summary: 'The id of the voice channel to join if the bot isn\'t currently playing' },
		textChannelId: { type: 'string', command: false, api: APIParamLocation.BODY, summary: 'The id of the text channel to send queue update messages to' },
		query: { type: 'string', required: true, command: true, api: APIParamLocation.BODY, summary: 'The link or query to find a song' }
	},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const voiceChannelId = args.voiceChannelId;
		const textChannelId = args.textChannelId;
		const query = args.query;

		if (!voiceChannelId) {
			throw new TypedError(ErrorTypes.INVALID_VOICE_CHANNEL_ID);
		}

		if (!query) {
			throw new TypedError(ErrorTypes.INVALID_QUERY);
		}

		const lengthBefore = (await tonelist.findOrCreateQueue(guildId)).tracks.length;

		const result = await tonelist.enqueue({
			guildId,
			query: query,
			voiceChannelId: voiceChannelId,
			textChannelId: textChannelId
		})

		let message = '';

		if (result.queue.tracks.length - lengthBefore > 1) {
			message = `Enqueued \`${result.queue.tracks[lengthBefore].info.title}\` and ${result.queue.tracks.length - lengthBefore - 1} more`;
		} else {
			message = `Enqueued \`${result.queue.tracks[result.queue.tracks.length - 1].info.title}\``;
		}

		return {
			message,
			...result
		};
	}
}