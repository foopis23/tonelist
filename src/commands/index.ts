import { enqueue } from './enqueue';
import { remove } from './remove';
import { join } from './join';
import { leave } from './leave';
import { skip } from './skip';
import { list } from './list';

export const commands = {
	enqueue,
	remove,
	join,
	leave,
	skip,
	list
} as const;
export { enqueue, remove, join, leave, skip, list };
export default commands;