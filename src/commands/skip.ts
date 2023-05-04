import { APIParamLocation, CommandConfig } from "./types";

export const skip: CommandConfig = {
	summary: 'Skip the current song',
	args: {
		guildId: { type: 'string', required: true, command: false, api: APIParamLocation.PATH, summary: 'The id of the discord server' },
	},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const result = await tonelist.skip({
			guildId
		});

		return {
			message: `Skipped \`${result.skipped?.title}\``,
			...result
		};
	}
}
