import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Enqueue: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('enqueue')
		.setDescription('Enqueue a song')
		.addStringOption(
			option => option
				.setName('query')
				.setDescription('The query to enqueue')
				.setRequired(true)
		),

	execute: async ({ interaction, tonelist, args, voiceChannel }) => {
		await interaction.deferReply();

		if (!voiceChannel) throw new Error('Join a voice channel to enqueue a song');

		const lengthBefore = (await tonelist.findOrCreateQueue(interaction.guildId)).tracks.length;

		const { queue } = await tonelist.enqueue({
			guildId: interaction.guildId,
			query: args.query as string,
			voiceChannelId: voiceChannel.id
		});

		if (queue.tracks.length - lengthBefore > 1) {
			await interaction.editReply(`Enqueued \`${queue.tracks[lengthBefore].info.title}\` and ${queue.tracks.length - lengthBefore - 1} more`);
			return;
		}

		await interaction.editReply(`Enqueued \`${queue.tracks[queue.tracks.length - 1].info.title}\``);
	}
}

export default Enqueue;
