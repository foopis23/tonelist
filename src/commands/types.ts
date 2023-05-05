import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Tonelist } from "../tonelist";
import { ZodSchema } from "zod";
import commands from ".";

export type BaseArgumentConfig = {
	type: 'string' | 'number' | 'boolean';
	required?: boolean;
	command?: boolean;
	api?: boolean;
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
	context: {
		tonelist: Tonelist;
		interaction?: ChatInputCommandInteraction;
	},
	input: {
		guildId: string;
		[key: string]: unknown;
	}
}

export interface CommandConfig {
	summary: string;
	slashCommand: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
	schema: ZodSchema;
	handler: (args: CommandContext) => Promise<{
		message?: string;
		[key: string]: unknown;
	}>;
}

export function isCommandKey(key: string): key is keyof typeof commands {
	return key in commands;
}