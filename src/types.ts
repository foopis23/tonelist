import { APIUser, Channel, ClientOptions, DMChannel, TextChannel, VoiceChannel } from "discord.js";
import { LoggerOptions } from "pino";
import { ConnectionInfo } from "lavaclient";
import { Track } from "@lavaclient/types/v3";
import { InitCommandOptions } from "./commands/types";
import { RPCError } from "./api/v1/rpc";
import { Store } from "@foopis23/ts-store";

export type InitOptions = {
	loggerOptions?: LoggerOptions;
	clientOptions?: Partial<ClientOptions>;
	commandOptions?: Partial<InitCommandOptions>;
	token: string;
	clientId: string;
	lavaConnectionInfo: ConnectionInfo;
	store?: Store<Queue>;
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
	CANNOT_REMOVE_CURRENT = 'Cannot remove the currently playing track'
}

const ERROR_TO_RPC_CODE: Record<TonelistErrorType, number> = {
	[TonelistErrorType.ALREADY_CONNECTED]: -32000,
	[TonelistErrorType.NOT_CONNECTED]: -32001,
	[TonelistErrorType.INDEX_OUT_OF_BOUNDS]: -32002,
	[TonelistErrorType.NOT_PLAYING]: -32003,
	[TonelistErrorType.NO_MORE_TRACKS]: -32004,
	[TonelistErrorType.CANNOT_REMOVE_CURRENT]: -32006
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

export const isTextBasedChannel = (channel: Channel): channel is TextChannel => {
	return channel.isTextBased();
}

export const isVoiceBasedChannel = (channel: Channel): channel is VoiceChannel => {
	return channel.isVoiceBased();
}

export const isThreadBasedChannel = (channel: Channel): channel is TextChannel => {
	return channel.isTextBased();
}

export const isDMBasedChannel = (channel: Channel): channel is DMChannel => {
	return channel.isDMBased();
}

export const isAPIUser = (user: unknown): user is APIUser =>
	typeof (user as APIUser).email === 'string' && typeof (user as APIUser).id === 'string';

