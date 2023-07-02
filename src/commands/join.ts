import { ErrorTypes, TypedError } from "../types";
import { APIParamLocation, CommandConfig } from "./types";

export const join: CommandConfig = {
	summary: 'Join a voice channel',
	args: {
		guildId: { type: 'string', required: true, command: false, api: APIParamLocation.PATH, summary: 'The id of the discord server' },
		voiceChannelId: { type: 'string', required: true, command: false, api: APIParamLocation.BODY, summary: 'The id of the voice channel to join' },
	},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const voiceChannelId = args.voiceChannelId;

		if (!voiceChannelId) {
			throw new TypedError(ErrorTypes.INVALID_VOICE_CHANNEL_ID);
		}

		const result = await tonelist.join({
			guildId,
			voiceChannelId
		});

		return {
			message: 'Joined the voice channel',
			...result
		};
	}
}
