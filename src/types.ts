import { Channel } from "discord.js";

export type TonelistConfig = {
	logLevel: string;
	token: string;
}

export type BaseArgument = {
	channel: Channel | string
}

export type EnqueueArgument = BaseArgument & {
	songURI: string
}

export type SkipArgument = BaseArgument;
export type PreviousArgument = BaseArgument;

export enum TonelistErrors {
	InvalidChannel = 'Invalid channel',
	InvalidChannelType = 'Channel is not a voice channel',
	ChannelNotJoinable = 'Channel is not joinable',
	InvalidSongURI = 'Invalid song URI',
	JukeboxInUseInDifferentChannel = 'Tonelist is in use in a different channel',
	BotNotInVoiceChannel = 'Tonelist is not in a voice channel',
}
