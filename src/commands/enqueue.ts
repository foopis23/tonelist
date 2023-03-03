import { SlashCommandBuilder } from 'discord.js';
import { CommandConfig } from './../types';
import getMemberVoiceChannel from './helpers/getMemberVoiceChannel';
import { TonelistCommandErrors } from './types';

const data = new SlashCommandBuilder()
	.setName('enqueue')
	.setDescription('Enqueue a song');

data.addStringOption(option => option
	.setName('song')
	.setDescription('The URI of the song to enqueue')
	.setRequired(true)
);

const Enqueue: CommandConfig = {
	data: data,
	execute: async (interaction, { tonelist }) => {
		// TODO: figure out how to type this properly
		const songURI = (interaction.options as any).getString('song');
		
		if (!songURI || typeof songURI !== 'string') {
			throw new Error(TonelistCommandErrors.InvalidSongURI);
		}

		const channel = getMemberVoiceChannel(interaction);

		await interaction.deferReply();
		await tonelist.enqueue({
			channel,
			songURI,
		})

		await interaction.editReply('Song enqueued!');
	}
}

export default Enqueue;