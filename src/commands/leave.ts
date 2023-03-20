import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Leave: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave the voice channel'),
	execute: async ({ interaction, tonelist, voiceChannel }) => {
		await interaction.deferReply();

		if (!voiceChannel) {
			await interaction.editReply('You need to be in a voice channel');
			return;
		}

		await tonelist.leave({
			guildId: interaction.guildId
		})

		await interaction.editReply('Left the voice channel');
	}
}

export default Leave;
