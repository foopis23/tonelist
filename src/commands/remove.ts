import { ErrorTypes, TypedError } from "../types";
import { APIParamLocation, CommandConfig } from "./types";

export const remove: CommandConfig = {
	summary: 'Remove a song from the queue',
	args: {
		guildId: { type: 'string', required: true, command: false, api: APIParamLocation.PATH, summary: 'The id of the discord server' },
		index: { type: 'number', required: true, command: true, api: APIParamLocation.BODY, summary: 'The index of the song to remove' }
	},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const index = args.index;

		if (index !== 0 && !index) {
			throw new TypedError(ErrorTypes.INVALID_INDEX);
		}

		const result = await tonelist.remove({
			guildId,
			index
		});

		return {
			message: `Removed \`${result.removedTrack.info.title}\``,
			...result
		};
	}
}
