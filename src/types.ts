import { APIUser, Channel, DMChannel, TextChannel, VoiceChannel } from "discord.js";
import { Track } from "@lavaclient/types/v3";

export type Queue = {
	textChannel?: string;
	tracks: Track[];
}

export enum ErrorTypes {
	ALREADY_CONNECTED = 'Already connected to a voice channel',
	NOT_CONNECTED = 'Not connected to a voice channel',
	NOT_PLAYING = 'Not playing',
	NO_MORE_TRACKS = 'No more tracks in queue',
	CANNOT_REMOVE_CURRENT = 'Cannot remove the currently playing track',
	QUEUE_NOT_FOUND = 'Queue not found...',
	GUILD_NOT_FOUND = 'Guild not found...',
	CHANNEL_NOT_FOUND = 'Channel not found...',
	INVALID_VOICE_CHANNEL_ID = 'Invalid voice channel id',
	INVALID_TEXT_CHANNEL_ID = 'Invalid text channel id',
	INVALID_QUERY = 'Invalid query',
	INVALID_INDEX = 'Index must be between 0 and the length of the queue',
	INVALID_GUILD_MEMBER = 'Invalid guild member :woa:',
}

export class TypedError extends Error {
	constructor(public type: ErrorTypes) {
		super(type);
	}
}

export const isTypedError = (error: unknown): error is TypedError =>
	typeof (error as TypedError).type === 'string';

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
