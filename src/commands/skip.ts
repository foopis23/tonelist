import { z } from "zod";
import { CommandConfig } from "./types";
import { SlashCommandBuilder } from "discord.js";

export const skip: CommandConfig = {
	summary: 'Skip the current song',
	slashCommand: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the current song'),
	schema: z.object({
		guildId: z.string().nonempty()
	}),
	handler: async ({ context, input }) => {
		const args = skip.schema.parse(input);

		const result = await context.tonelist.skip({
			guildId: args.guildId
		});

		return {
			message: `Skipped \`${result.skipped?.title}\``,
			...result
		};
	}
} as const satisfies CommandConfig;
