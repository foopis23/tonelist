export function formatDuration(durationMS: number) {
	const duration = new Date(durationMS);

	let hours = duration.getUTCHours().toString().padStart(2, '0');
	const minutes = duration.getUTCMinutes().toString().padStart(2, '0');
	const seconds = duration.getUTCSeconds().toString().padStart(2, '0');

	// if duration is longer than days, add days to hours
	if (duration.getUTCDate() > 1) {
		hours = ((duration.getUTCDate() - 1) * 24 + duration.getUTCHours()).toString();
	}

	const hoursString = hours !== '00' ? `${hours}:` : '';
	const minutesString = minutes !== '00' ? `${minutes}:` : '';
	const secondsString = seconds !== '00' ? `${seconds}` : '';

	return `${hoursString}${minutesString}${secondsString}`;
}

type plainTextOptions = {
	maxColumnWidths?: number[] | number;
	header?: boolean
	footer?: boolean
	topAndBottomBorder?: boolean
}

export function formatPlainTextTable(rows: string[][], { maxColumnWidths = -1, header = false, footer = false, topAndBottomBorder = false }: plainTextOptions = {}) {
	// catch case that would cause error
	if (rows.length === 0) {
		return '';
	}

	// if passed a number for all columns, make an array of that number
	let maxColumnWidthsArray: number[] = [];
	if (typeof maxColumnWidths === 'number') {
		maxColumnWidthsArray = rows[0].map(() => maxColumnWidths);
	} else {
		maxColumnWidthsArray = maxColumnWidths;
	}


	const trimmedRows = rows
		// truncate columns that are too long
		.map((row) => {
			return row.map((column, index) => {
				if (maxColumnWidthsArray[index] === -1) {
					return column;
				}

				if (column.length > maxColumnWidthsArray[index]) {
					return column.substring(0, maxColumnWidthsArray[index] - 3) + '...';
				}

				return column;
			});
		})

	// find the longest string in each column
	const columnWidths = trimmedRows.reduce((columnWidths, row) => {
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

	// pad columns and add borders
	const plainTextRows = trimmedRows.map((row) => {
		const formattedRow = row.map((column, index) => {
			if (index === 0) {
				return column.padStart(columnWidths[index]);
			}

			return column.padEnd(columnWidths[index]);
		}).join(' | ');

		return '| ' + formattedRow + ' |';
	});

	// add divider row between header and body
	if (header) {
		plainTextRows.splice(1, 0, '| ' + columnWidths.map(width => '='.repeat(width)).join(' | ') + ' |');
	}

	// add divider row between body and footer
	if (footer) {
		plainTextRows.splice(-1, 0, '| ' + columnWidths.map(width => '='.repeat(width)).join(' | ') + ' |');
	}

	if (topAndBottomBorder) {
		const border = "=".repeat(plainTextRows[0].length);
		plainTextRows.unshift(border);
		plainTextRows.push(border);
	}

	// join rows with newlines
	return plainTextRows.join('\n');
}
