import { SlashCommandBuilder } from 'discord.js';
import { CommandConfig } from './../types';
import getMemberVoiceChannel from './helpers/getMemberVoiceChannel';

const data = new SlashCommandBuilder()
	.setName('remove')
	.setDescription('removes a song from the queue');
data.addIntegerOption(option => option.setName('position').setDescription('position of the song to remove').setRequired(true));

const Remove: CommandConfig = {
	data: data,
	execute: async (interaction, { tonelist }) => {
		const channel = getMemberVoiceChannel(interaction);
		const position = (interaction.options as any).getInteger('position');
		await interaction.deferReply();
		await tonelist.remove({ channel, position });
		await interaction.editReply('Song removed');
	}
}

export default Remove;