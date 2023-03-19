import { SlashCommandBuilder } from "discord.js";
import { StoreErrorType } from "../store/types";
import { TonelistErrorType } from "../types";
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
		try {
			await interaction.deferReply();

			if (!voiceChannel) throw new Error('Join a voice channel to enqueue a song');

			const lengthBefore = (await tonelist.findOrCreateQueue(interaction.guildId)).tracks.length;

			const { queue } = await tonelist.enqueue({
				guildId: interaction.guildId,
				query: args.query as string,
				voiceChannelId: voiceChannel.id
			});

			if (queue.tracks.length - lengthBefore > 1) {
				await interaction.editReply(`Enqueued \`${queue.tracks[queue.tracks.length - 1].info.title}\` and ${queue.tracks.length - lengthBefore - 1} more`);
				return;
			}

			await interaction.editReply(`Enqueued \`${queue.tracks[queue.tracks.length - 1].info.title}\``);
		} catch (error) {
			if (error.type) {
				switch (error.type) {
					case TonelistErrorType.ALREADY_CONNECTED:
						await interaction.editReply('Already connected to a voice channel');
						return;
					case TonelistErrorType.NOT_CONNECTED:
						await interaction.editReply('Not connected to a voice channel');
						return;
					case TonelistErrorType.INDEX_OUT_OF_BOUNDS:
						await interaction.editReply('Index needs to be between 0 and the queue length');
						return;
					case StoreErrorType.NOT_FOUND:
						await interaction.editReply('No queue found');
						return;
				}
			}

			await interaction.editReply('An error occurred: ' + error.message || 'Unknown error');
		}
	}
}

export default Enqueue;
