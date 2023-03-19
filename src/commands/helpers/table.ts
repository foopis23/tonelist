function makePlainTextTable(rows: string[][]) {
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

	const formattedRows = rows.map((row) => {
		const formattedRow = row.map((column, index) => {
			if (index === 0) {
				return column.padStart(columnWidths[index]);
			}

			return column.padEnd(columnWidths[index]);
		}).join(' | ');

		return '| ' + formattedRow + ' |';
	});

	// add divider row between header and body
	formattedRows.splice(1, 0, '| ' + columnWidths.map(width => '='.repeat(width)).join(' | ') + ' |');

	const table = formattedRows.join('\n');

	return table;
}

export default makePlainTextTable;
