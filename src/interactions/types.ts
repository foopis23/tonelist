import { APIInteractionDataResolvedChannel, APIInteractionDataResolvedGuildMember, APIRole, Attachment, ChatInputCommandInteraction, GuildBasedChannel, GuildMember, Interaction, Role, User } from "discord.js"
import { ApplicationCommandType } from "discord.js";

export type InteractionChannel = NonNullable<APIInteractionDataResolvedChannel | GuildBasedChannel>;
export type InteractionRole = NonNullable<Role | APIRole>;
export type InteractionMentionable = NonNullable<User | InteractionRole | APIRole | GuildMember | APIInteractionDataResolvedGuildMember>;

export type CommandArguments = {
	[key: string]: string | number | boolean | User | InteractionChannel | InteractionRole | InteractionMentionable | Attachment;
}

export type InitCommandOptions = {
	testGuilds?: string[];
}

export const isGuildMember = (member: ChatInputCommandInteraction['member']): member is GuildMember =>
	!!(member as GuildMember).id;

export const isInteractionCommand = (interaction: Interaction): interaction is ChatInputCommandInteraction =>
	typeof (interaction as ChatInputCommandInteraction).commandType === 'number'
	&& (interaction as ChatInputCommandInteraction).commandType === ApplicationCommandType.ChatInput;

