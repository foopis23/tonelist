import { z } from "zod";
import { CommandConfig } from "./types";
import { SlashCommandBuilder } from "discord.js";

const schema = z.object({
	guildId: z.string().nonempty()
});

export const leave = {
	summary: 'Leave the voice channel',
	slashCommand: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave the voice channel'),
	schema: schema,
	handler: async ({ context, input }) => {
		const args = schema.parse(input);

		const result = await context.tonelist.leave({
			guildId: args.guildId
		});

		return {
			message: 'Left the voice channel',
			...result
		};
	}
} as const satisfies CommandConfig;

