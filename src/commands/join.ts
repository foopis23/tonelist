import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Join: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join the voice channel'),
	execute: async ({ interaction, tonelist, voiceChannel, textChannel }) => {
		await interaction.deferReply();

		const queue = (await tonelist.findOrCreateQueue(interaction.guildId)).tracks;

		if (queue.length === 0) {
			await interaction.editReply('The queue is empty');
			return;
		}

		if (!voiceChannel) {
			await interaction.editReply('You need to be in a voice channel');
			return;
		}

		await tonelist.join({
			guildId: interaction.guildId,
			voiceChannelId: voiceChannel.id,
			textChannelId: textChannel.id
		})

		await interaction.editReply('Joined the voice channel');
	}
}

export default Join;
