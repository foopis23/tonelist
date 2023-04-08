import { ClientOptions } from "discord.js";
import { LoggerOptions } from "pino";
import { ConnectionInfo } from "lavaclient";
import { Track } from "@lavaclient/types/v3";
import { InitCommandOptions } from "./commands/types";
import { RPCError } from "./api/v1/types";

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
	NOT_PLAYING = 'Not playing',
	NO_MORE_TRACKS = 'No more tracks in queue',
}

const ERROR_TO_RPC_CODE: Record<TonelistErrorType, number> = {
	[TonelistErrorType.ALREADY_CONNECTED]: -32000,
	[TonelistErrorType.NOT_CONNECTED]: -32001,
	[TonelistErrorType.INDEX_OUT_OF_BOUNDS]: -32002,
	[TonelistErrorType.NOT_PLAYING]: -32003,
	[TonelistErrorType.NO_MORE_TRACKS]: -32004,
};

export class TonelistError extends Error implements RPCError {
	constructor(message: string, public type: TonelistErrorType) {
		super(message);
	}

	toRpcError() {
		return {
			code: ERROR_TO_RPC_CODE[this.type],
			message: this.message
		};
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
	textChannelId?: string;
	query: string;
}

export type RemoveArguments = {
	guildId: string;
	index: number;
}

export type QueueArguments = {
	guildId: string;
}

export type SkipArguments = {
	guildId: string;
}
