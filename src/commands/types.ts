import { APIInteractionDataResolvedChannel, APIInteractionDataResolvedGuildMember, APIRole, Attachment, ChatInputCommandInteraction, GuildBasedChannel, GuildMember, Role, SlashCommandBuilder, User } from "discord.js"

export type InteractionChannel = NonNullable<APIInteractionDataResolvedChannel | GuildBasedChannel>;
export type InteractionRole = NonNullable<Role | APIRole>;
export type InteractionMentionable = NonNullable<User | InteractionRole | APIRole | GuildMember | APIInteractionDataResolvedGuildMember>;

export type CommandArguments = {
	[key: string]: string | number | boolean | User | InteractionChannel | InteractionRole | InteractionMentionable | Attachment;
}

export type CommandConfig = {
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
	execute: (interaction: ChatInputCommandInteraction, args: CommandArguments) => Promise<void>
}

export type InitCommandOptions = {
	testGuilds?: string[];
}
