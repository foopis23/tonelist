import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import { APIParamLocation, CommandConfig, CommandArgumentConfig } from "../commands/types";

const isPathArg = ([, arg]: [string, CommandArgumentConfig]) => arg.api === APIParamLocation.PATH;
const isBodyArg = ([, arg]: [string, CommandArgumentConfig]) => arg.api === APIParamLocation.BODY;
const isArgRequired = ([, arg]: [string, CommandArgumentConfig]) => arg.required;

const isGuildIdInPath = (arg: unknown): arg is { guildId: string } => {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const { guildId } = arg as { guildId: unknown };
	return typeof guildId === 'string';
}

// TODO: maybe fix this type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reduceArgEntryToSchema = (acc: Record<string, any>, [key, arg]: [string, CommandArgumentConfig]) => {
	acc[key] = {
		type: arg.type,
		description: arg.summary
	};
	return acc;
}

function buildSchema(command: CommandConfig) {
	const { summary, args } = command;
	const requiredBody = Object.entries(args)
		.filter(isBodyArg)
		.filter(isArgRequired)
		.map(([key]) => key);

	const requiredParams = Object.entries(args)
		.filter(isPathArg)
		.filter(isArgRequired)
		.map(([key]) => key);

	const paramProperties = Object.entries(args)
		.filter(isPathArg)
		.reduce(reduceArgEntryToSchema, {});

	const bodyProperties = Object.entries(args)
		.filter(isBodyArg)
		.reduce(reduceArgEntryToSchema, {});

	const schema = {
		summary,
		params: {
			type: 'object',
			properties: paramProperties,
			required: (requiredParams.length > 0 ? requiredParams : undefined)
		},
		body: {
			type: 'object',
			properties: bodyProperties,
			required: (requiredBody.length > 0 ? requiredBody : undefined)
		}
	};

	return schema;
}

const commands: FastifyPluginAsync<FastifyPluginOptions & { commands: Record<string, CommandConfig> }> = async function (fastify, opts) {
	const { commands } = opts;

	for (const [name, command] of Object.entries(commands)) {
		fastify.post(`/${name}`, {
			schema: buildSchema(command)
		}, async (request, reply) => {
			if (typeof request.body !== 'object') {
				reply.code(400);
				throw new Error('Invalid request body');
			}

			if (!isGuildIdInPath(request.params)) {
				reply.code(400);
				throw new Error('Missing guildId in path');
			}

			try {
				const response = await command.handler({
					tonelist: request.tonelist,
					guildId: request.params.guildId,
					...request.body,
					...request.params
				});

				return response;
			} catch (e) {
				reply.code(500);
				return {
					message: e.message
				}
			}
		});
	}
}

export default commands;