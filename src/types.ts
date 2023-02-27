import { Channel } from "discord.js";

export type TonelistConfig = {
	logLevel: string;
	token: string;
}

export type EnqueueArgument = {
	channel: Channel | string,
	songURI: string
}