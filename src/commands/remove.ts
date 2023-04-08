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

		const { removedTrack } = await tonelist.remove({
			guildId: interaction.guildId,
			index
		});

		await interaction.editReply(`Removed ${removedTrack.info.title}`);
	}
}

export default Remove;
