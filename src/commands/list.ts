import { SlashCommandBuilder } from "discord.js";
import makePlainTextTable from "./helpers/table";
import { CommandConfig } from "./types";

function formateDuration(durationMS: number) {
	const duration = new Date(durationMS);

	const hours = duration.getUTCHours().toString().padStart(2, '0');
	const minutes = duration.getUTCMinutes().toString().padStart(2, '0');
	const seconds = duration.getUTCSeconds().toString().padStart(2, '0');

	const hoursString = hours !== '00' ? `${hours}:` : '';
	const minutesString = minutes !== '00' ? `${minutes}:` : '';
	const secondsString = seconds !== '00' ? `${seconds}` : '';

	return `${hoursString}${minutesString}${secondsString}`;
}

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
		const body = queue.map((track, index) => [index.toString(), track.info.title, track.info.isStream ? 'LIVE' : formateDuration(track.info.length)]);

		const table = makePlainTextTable([headers, ...body]);

		await interaction.editReply('```' + table + '```');
	}
}

export default List;