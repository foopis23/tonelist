import { APIParamLocation, CommandConfig } from "./types";

export const leave: CommandConfig = {
	summary: 'Leave the voice channel',
	args: {
		guildId: { type: 'string', required: true, command: false, api: APIParamLocation.PATH, summary: 'The id of the discord server' },
	},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const result = await tonelist.leave({
			guildId
		});

		return {
			message: 'Left the voice channel',
			...result
		};
	}
}
