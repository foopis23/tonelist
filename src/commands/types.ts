import { APIInteractionDataResolvedChannel, APIInteractionDataResolvedGuildMember, APIRole, Attachment, ChatInputCommandInteraction, GuildBasedChannel, GuildMember, GuildTextBasedChannel, Role, SlashCommandBuilder, TextChannel, User, VoiceBasedChannel, VoiceChannel } from "discord.js"
import { Tonelist } from "../tonelist";

export type InteractionChannel = NonNullable<APIInteractionDataResolvedChannel | GuildBasedChannel>;
export type InteractionRole = NonNullable<Role | APIRole>;
export type InteractionMentionable = NonNullable<User | InteractionRole | APIRole | GuildMember | APIInteractionDataResolvedGuildMember>;

export type CommandArguments = {
	[key: string]: string | number | boolean | User | InteractionChannel | InteractionRole | InteractionMentionable | Attachment;
}

export type CommandContext = {
	interaction: ChatInputCommandInteraction;
	tonelist: Tonelist;
	args: CommandArguments;
	voiceChannel?: VoiceBasedChannel | undefined;
	textChannel: GuildTextBasedChannel
}

export type CommandConfig = {
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
	execute: (context: CommandContext) => Promise<void>
}

export type InitCommandOptions = {
	testGuilds?: string[];
}
