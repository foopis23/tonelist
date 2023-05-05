import { SlashCommandBuilder } from 'discord.js';
import { z } from "zod";
import { CommandConfig } from "./types";

const schema = z.object({
	guildId: z.string().nonempty(),
	index: z.number().int().gte(0)
});

export const remove = {
	summary: 'Remove a song from the queue',
	slashCommand: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a song from the queue')
		.addIntegerOption(option =>
			option
				.setName('index')
				.setDescription('The index of the song to remove')
				.setRequired(true)
		),
	schema,
	handler: async ({ input, context }) => {
		const args = schema.parse(input);

		const result = await context.tonelist.remove({
			guildId: args.guildId,
			index: args.index
		});

		return {
			message: `Removed \`${result.removedTrack.info?.title}\``,
			...result
		};
	}
} as const satisfies CommandConfig;
