import { Channel, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Tonelist } from "./tonelist";

export type TonelistConfig = {
	logLevel: string;
	token: string;
	mongoUri: string;
	useTestGuilds?: boolean;
	testGuilds?: string[];
	clientId: string;
}

export type BaseArgument = {
	channel: Channel | string
}

export type EnqueueArgument = BaseArgument & {
	songURI: string
}

export type SkipArgument = BaseArgument;
export type PreviousArgument = BaseArgument;
export type FlushArgument = BaseArgument;

export enum TonelistErrors {
	InvalidChannel = 'Invalid channel',
	InvalidChannelType = 'Channel is not a voice channel',
	ChannelNotJoinable = 'Channel is not joinable',
	InvalidSongURI = 'Invalid song URI',
	JukeboxInUseInDifferentChannel = 'Tonelist is in use in a different channel',
	BotNotInVoiceChannel = 'Tonelist is not in a voice channel',
	NoPreviousSong = 'No previous song',
	QueuePositionOutOfBounds = 'There are no more songs in the queue',
}

export type CommandContext = {
	tonelist: Tonelist
};

export type CommandExecuteAction = (interaction: CommandInteraction, context: CommandContext) => Promise<void>;

export type CommandConfig = {
	data: SlashCommandBuilder,
	execute: CommandExecuteAction
}