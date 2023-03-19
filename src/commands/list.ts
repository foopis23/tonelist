import { SlashCommandBuilder } from "discord.js";
import makePlainTextTable from "./helpers/table";
import { CommandConfig } from "./types";

const List: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List the queue'),

	execute: async ({ interaction, tonelist }) => {
		await interaction.deferReply();

		const queue = (await tonelist.findOrCreateQueue(interaction.guildId)).tracks;

		if (queue.length === 0) {
			await interaction.editReply('The queue is empty');
			return;
		}

		const headers = ['Index', 'Title', 'Duration'];
		const body = queue.map((track, index) => [index.toString(), track.info.title, track.info.isStream ? 'LIVE' : track.info.length.toString()]);

		const table = makePlainTextTable([headers, ...body]);

		await interaction.editReply('```' + table + '```');
	}
}

export default List;