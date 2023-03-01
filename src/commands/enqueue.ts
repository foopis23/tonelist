import { CommandInteraction, GuildMember } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { CommandConfig } from './../types';
import { TonelistCommandErrors } from './types';

const data = new SlashCommandBuilder()
	.setName('enqueue')
	.setDescription('Enqueue a song');

data.addStringOption(option => option
	.setName('song')
	.setDescription('The URI of the song to enqueue')
	.setRequired(true)
);

function getMemberVoiceChannel(interaction: CommandInteraction) {
	if (!interaction.member || !(interaction.member as GuildMember).voice.channel) {
		throw new Error(TonelistCommandErrors.CannotGetVoiceChannel);
	}

	const channel = (interaction.member as GuildMember).voice.channel;

	if (!channel) {
		throw new Error(TonelistCommandErrors.CannotGetVoiceChannel);
	}

	return channel;
}

const Enqueue: CommandConfig = {
	data: data,
	execute: async (interaction, { tonelist }) => {
		// TODO: figure out how to type this properly
		const songURI = (interaction.options as any).getString('song');
		
		if (!songURI || typeof songURI !== 'string') {
			throw new Error(TonelistCommandErrors.InvalidSongURI);
		}

		const channel = getMemberVoiceChannel(interaction);
		
		await Promise.all([
			interaction.deferReply(),
			tonelist.enqueue({
				channel,
				songURI,
			})
		])

		await interaction.editReply('Song enqueued!');
	}
}

export default Enqueue;