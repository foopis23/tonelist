import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "../types";
import getMemberVoiceChannel from "./helpers/getMemberVoiceChannel";

const Previous : CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('previous')
		.setDescription('Plays the previous song'),
	execute: async (interaction, { tonelist }) => {
		await interaction.deferReply();

		const channel = getMemberVoiceChannel(interaction);
		await tonelist.previous({ channel });
		await interaction.editReply('Playing previous song');
	}
}

export default Previous;