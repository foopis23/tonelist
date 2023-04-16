import { formatDuration, formatPlainTextTable } from "../util/text";
import { APIParamLocation, CommandConfig } from "./types";

export const list : CommandConfig = {
	summary: 'List the current queue',
	args: {
		guildId: { type: 'string', required: true, command: false, api: APIParamLocation.PATH, summary: 'The id of the discord server' },
	},
	handler: async (args) => {
		const {
			tonelist,
			guildId
		} = args;

		const queue = (await tonelist.findOrCreateQueue(guildId));
		let message = '';
		if (queue.tracks.length === 0) {
			message = 'Queue is empty';
		} else {
			const page = queue.tracks.slice(0, 15);

			const totalQueueDuration = queue.tracks.reduce((total, track) => total + track.info.length, 0);

			const header = ['Index', 'Title', 'Duration'];
			const footer = [`${page.length}/${queue.tracks.length}`, '', formatDuration(totalQueueDuration)]
			const body = page.map((track, index) => [index.toString(), track.info.title, track.info.isStream ? 'LIVE' : formatDuration(track.info.length)]);

			// this makes the table 80 characters wide (seems to be good for smaller screens and allows for more rows to be displayed at once)
			const indexLength = Math.max(header[0].length, footer[0].length);
			const durationLength = Math.max(header[2].length, footer[2].length);
			const titleLength = 80 - indexLength - durationLength - header.length - 1 * 3 - 4;

			const table = formatPlainTextTable([header, ...body, footer],
				{
					maxColumnWidths: [indexLength, titleLength, durationLength],
					header: true,
					footer: true,
					topAndBottomBorder: true,
				}
			);
			message = '```' + table + '```';
		}

		return {
			message,
			...queue
		}
	}
};
