import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Remove: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a track from the queue')
		.addIntegerOption(option => option.setName('index').setDescription('The index of the track to remove').setRequired(true)),
	execute: async ({ interaction, tonelist }) => {
		await interaction.deferReply();

		const index = interaction.options.getInteger('index', true);

		const queue = (await tonelist.findOrCreateQueue(interaction.guildId)).tracks;

		if (index < 0 || index >= queue.length) {
			await interaction.editReply('Invalid index. Index needs to be between 0 and the queue length');
			return;
		}

		const removedTrack = queue.splice(index, 1)[0];

		await interaction.editReply(`Removed ${removedTrack.info.title}`);
	}
}

export default Remove;
