import { router } from '../trpc';
import { protectedProcedure } from "../trpc";
import commands from '../../../commands';

export const commandRouter = router({
	enqueue: protectedProcedure
		.input(commands.enqueue.schema)
		.query(({ ctx, input }) => commands.enqueue.handler({
			context: ctx,
			input: input
		})),
	remove: protectedProcedure
		.input(commands.remove.schema)
		.query(({ ctx, input }) => commands.remove.handler({
			context: ctx,
			input: input
		})),
	join: protectedProcedure
		.input(commands.join.schema)
		.query(({ ctx, input }) => commands.join.handler({
			context: ctx,
			input: input
		})),
	leave: protectedProcedure
		.input(commands.leave.schema)
		.query(({ ctx, input }) => commands.leave.handler({
			context: ctx,
			input: input
		})),
	skip: protectedProcedure
		.input(commands.skip.schema)
		.query(({ ctx, input }) => commands.skip.handler({
			context: ctx,
			input: input
		})),
	list: protectedProcedure
		.input(commands.list.schema)
		.query(({ ctx, input }) => commands.list.handler({
			context: ctx,
			input: input
		})),
})