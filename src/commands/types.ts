import { APIUser, ChatInputCommandInteraction, User } from "discord.js";
import { Tonelist } from "../tonelist";
import { FastifyRequest } from "fastify";

export enum APIParamLocation {
	QUERY = 'query',
	PATH = 'path',
	BODY = 'body',
}

export type BaseArgumentConfig = {
	type: 'string' | 'number' | 'boolean';
	required?: boolean;
	command?: boolean;
	api?: APIParamLocation | false;
	summary: string;
}

export type ArrayArgumentConfig = BaseArgumentConfig & {
	type: 'array';
	items: BaseArgumentConfig[];
}

export type ObjectArgumentConfig = BaseArgumentConfig & {
	type: 'object';
	properties: {
		[key: string]: BaseArgumentConfig;
	}
}

export type CommandArgumentConfig = BaseArgumentConfig | ArrayArgumentConfig | ObjectArgumentConfig;

export type CommandContext = {
	guildId: string;
	tonelist: Tonelist;
	user?: User | APIUser;
	voiceChannelId?: string;
	textChannelId?: string;
	interaction?: ChatInputCommandInteraction;
	request?: FastifyRequest;
	query?: string;
	index?: number;
	[key: string]: unknown;
}

export type CommandConfig = {
	summary: string;
	args: {
		[key: string]: CommandArgumentConfig
	},
	handler: (args: CommandContext) => Promise<{
		message?: string;
		[key: string]: unknown;
	}>;
}
