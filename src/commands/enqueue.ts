import { z } from "zod";
import { CommandConfig } from "./types";
import { SlashCommandBuilder } from "discord.js";

const schema = z.object({
	guildId: z.string().nonempty(),
	voiceChannelId: z.string().nonempty(),
	textChannelId: z.string().optional(),
	query: z.string().nonempty()
});

export const enqueue = {
	summary: 'Enqueue a song',
	slashCommand: new SlashCommandBuilder()
		.setName('enqueue')
		.setDescription('Enqueue a song')
		.addStringOption(option =>
			option
				.setName('query')
				.setDescription('The link or query to find a song')
				.setRequired(true)
		),
	schema,
	handler: async ({ context, input }) => {
		const args = schema.parse(input);
		const {
			tonelist
		} = context;
		const guildId = args.guildId;
		const voiceChannelId = args.voiceChannelId;
		const textChannelId = args.textChannelId;
		const query = args.query;

		const lengthBefore = (await tonelist.findOrCreateQueue(guildId)).tracks.length;
		const result = await tonelist.enqueue({
			guildId,
			query: query,
			voiceChannelId: voiceChannelId,
			textChannelId: textChannelId
		})

		let message = '';
		if (result.queue.tracks && result.queue.tracks.length - lengthBefore > 1) {
			message = `Enqueued \`${result.queue.tracks[lengthBefore].info?.title}\` and ${result.queue.tracks.length - lengthBefore - 1} more`;
		} else {
			message = `Enqueued \`${result.queue.tracks[result.queue.tracks.length - 1].info?.title}\``;
		}

		return {
			message,
			...result
		};
	}
} as const satisfies CommandConfig;
