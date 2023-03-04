import { SlashCommandBuilder } from 'discord.js';
import { CommandConfig } from '../types';
import getMemberVoiceChannel from './helpers/getMemberVoiceChannel';

const Flush: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('flush')
		.setDescription('clears the queue'),
	execute: async (interaction, { tonelist }) => {
		const channel = getMemberVoiceChannel(interaction);
		await interaction.deferReply();
		await tonelist.flush({ channel });
		await interaction.editReply('Queue cleared');
	}
}

export default Flush;