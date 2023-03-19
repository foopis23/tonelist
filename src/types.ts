import { ClientOptions } from "discord.js";
import { LoggerOptions } from "pino";
import { ConnectionInfo } from "lavaclient";
import { Track } from "@lavaclient/types/v3";
import { InitCommandOptions } from "./commands/types";

export type InitOptions = {
	loggerOptions?: LoggerOptions;
	clientOptions?: Partial<ClientOptions>;
	commandOptions?: Partial<InitCommandOptions>;
	token: string;
	clientId: string;
	lavaConnectionInfo: ConnectionInfo;
}

export type Queue = {
	textChannel?: string;
	tracks: Track[];
}

export enum TonelistErrorType {
	ALREADY_CONNECTED = 'Already connected to a voice channel',
	NOT_CONNECTED = 'Not connected to a voice channel',
	INDEX_OUT_OF_BOUNDS = 'Index out of bounds',
}

export class TonelistError extends Error {
	constructor(message: string, public type: TonelistErrorType) {
		super(message);
	}
}

export type JoinArguments = {
	guildId: string;
	textChannelId?: string;
	voiceChannelId: string;
}

export type LeaveArguments = {
	guildId: string;
}

export type EnqueueArguments = {
	guildId: string;
	voiceChannelId: string;
	query: string;
}

export type RemoveArguments = {
	guildId: string;
	index: number;
}

export type QueueArguments = {
	guildId: string;
}
