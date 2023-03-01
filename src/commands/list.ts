import { SlashCommandBuilder } from 'discord.js';
import { CommandConfig } from './../types';
import getMemberVoiceChannel from './helpers/getMemberVoiceChannel';
import { TonelistCommandErrors } from './types';

function makePlainTextTable(rows: string[][], currentIndex: number) {
	const columnWidths = rows.reduce((columnWidths, row) => {
		row.forEach((column, index) => {
			if (!columnWidths[index]) {
				columnWidths[index] = 0;
			}

			if (column.length > columnWidths[index]) {
				columnWidths[index] = column.length;
			}
		});

		return columnWidths;
	}, [] as number[]);

	const formattedRows = rows.map((row, rowIndex) => {
		const formattedRow = row.map((column, index) => {
			if (index === 0) {
				return column.padStart(columnWidths[index]);
			}

			return column.padEnd(columnWidths[index]);
		}).join(' | ');

		// add | at the end of the row
		if (rowIndex - 1 === currentIndex) {
			return '> | ' + formattedRow + ' | <';
		}

		return '  | ' + formattedRow + ' |';
	});

	// add divider row between header and body
	formattedRows.splice(1, 0, '  | ' + columnWidths.map(width => '='.repeat(width)).join(' | ') + ' |');

	const table = formattedRows.join('\n');

	return table;
}


const List: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Lists the songs in the queue'),
	execute: async (interaction, { tonelist }) => {
		const channel = getMemberVoiceChannel(interaction);

		await interaction.deferReply();
		const queue = await tonelist.getQueue({ channel })

		if (!queue) {
			throw new Error(TonelistCommandErrors.QueueNotFound);
		}

		const songs = makePlainTextTable([["Index", "Song"], ...queue.songs.map((song, index) => {
			return [(index + 1).toString(), song]
		})], queue.pointer);




		await interaction.editReply(`\`\`\`\n${songs}\n\`\`\``);
	}
}

export default List;