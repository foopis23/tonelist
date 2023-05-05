import { z } from "zod";
import { CommandConfig } from "./types";
import { SlashCommandBuilder } from "discord.js";

const schema = z.object({
	guildId: z.string().nonempty(),
	voiceChannelId: z.string().nonempty()
});

export const join = {
	summary: 'Join a voice channel',
	slashCommand: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join a voice channel'),
	schema,
	handler: async ({ context, input }) => {
		const args = schema.parse(input);

		const result = await context.tonelist.join({
			guildId: args.guildId,
			voiceChannelId: args.voiceChannelId
		});

		return {
			message: 'Joined the voice channel',
			...result
		};
	}
} as const satisfies CommandConfig;
