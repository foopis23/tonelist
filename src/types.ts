import { Channel } from "discord.js";

export type TonelistConfig = {
	logLevel: string;
	token: string;
}

export type EnqueueArgument = {
	channel: Channel | string,
	songURI: string
}

export enum TonelistErrors {
	InvalidChannel = 'Invalid channel',
	InvalidChannelType = 'Channel is not a voice channel',
	ChannelNotJoinable = 'Channel is not joinable',
	InvalidSongURI = 'Invalid song URI',
	JukeboxInUseInDifferentChannel = 'Tonelist is in use in a different channel',
}
