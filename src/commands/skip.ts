import { SlashCommandBuilder } from 'discord.js';
import { CommandConfig } from './../types';
import getMemberVoiceChannel from './helpers/getMemberVoiceChannel';

const Skip : CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current song'),
	execute: async (interaction, { tonelist }) => {
		await interaction.deferReply();

		const channel = getMemberVoiceChannel(interaction);
		await tonelist.skip({ channel });
		await interaction.editReply('Skipped song');
	}
}

export default Skip;