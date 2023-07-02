import { ErrorTypes, TypedError } from "../types";
import { CommandConfig } from "./types";


export const shuffle: CommandConfig = {
	summary: 'Shuffle all songs in current queue',
	args: {},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const voiceChannelId = args.voiceChannelId;
		if (!voiceChannelId) {
			throw new TypedError(ErrorTypes.INVALID_VOICE_CHANNEL_ID);
		}

		const result = await tonelist.shuffle({
			guildId
		});

		return {
			message: 'Shuffled queue',
			...result
		};
	}
}
