import { ApplicationCommandOptionType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Tonelist } from "../tonelist";
import { ErrorTypes, TypedError, isChatInputCommandInteraction, isTypedError } from "../types";
import { CommandArguments, InitCommandOptions, isGuildMember } from "./types";
import commands from "../commands";
import { CommandConfig, isCommandKey } from "../commands/types";

type CommandBuilder = SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

function getCommandArguments(command: CommandBuilder, interaction: ChatInputCommandInteraction): CommandArguments {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return command.options.reduce((acc: Record<string, any>, option) => {
		const optionJSON = option.toJSON();
		switch (optionJSON.type) {
			case ApplicationCommandOptionType.String:
				acc[optionJSON.name] = interaction.options.getString(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Integer:
				acc[optionJSON.name] = interaction.options.getInteger(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Boolean:
				acc[optionJSON.name] = interaction.options.getBoolean(optionJSON.name);
				break;
			case ApplicationCommandOptionType.User:
				acc[optionJSON.name] = interaction.options.getUser(optionJSON.name)
				break;
			case ApplicationCommandOptionType.Channel:
				acc[optionJSON.name] = interaction.options.getChannel(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Role:
				acc[optionJSON.name] = interaction.options.getRole(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Mentionable:
				acc[optionJSON.name] = interaction.options.getMentionable(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Number:
				acc[optionJSON.name] = interaction.options.getNumber(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Attachment:
				acc[optionJSON.name] = interaction.options.getAttachment(optionJSON.name);
				break;
			default:
				break;
		}
		return acc;
	}, {})
}


async function registerCommands(tonelist: Tonelist, testGuilds: string[]) {
	const applicationCommandManager = tonelist.client?.application?.commands;
	if (!applicationCommandManager) {
		throw new Error('Application command manager not found');
	}
	const listOfBuilders = Object.values(commands).map(command => command.slashCommand);
	await applicationCommandManager.set(listOfBuilders);
	if (testGuilds && testGuilds.length > 0) {
		const guildResults = await Promise.allSettled(testGuilds.map(guildId => tonelist.getGuild(guildId)));
		for (const guildResult of guildResults) {
			if (guildResult.status === 'fulfilled') {
				const guild = guildResult.value;
				await guild.commands.set(listOfBuilders);
			}
		}
	}
}

async function initInteractions(tonelist: Tonelist, options: InitCommandOptions) {
	await registerCommands(tonelist, options.testGuilds ?? []);

	tonelist.client?.on('interactionCreate', async (interaction) => {
		if (!interaction.isCommand()) {
			return;
		}

		if (!isCommandKey(interaction.commandName)) {
			throw new Error('Command already registered');
		}

		const command: CommandConfig = commands[interaction.commandName];
		if (!command) {
			return;
		}

		if (isChatInputCommandInteraction(interaction)) {
			try {
				const args = getCommandArguments(command.slashCommand, interaction);

				if (!interaction.guildId) {
					throw new Error('Guild ID not found');
				}

				if (!isGuildMember(interaction.member)) {
					throw new TypedError(ErrorTypes.INVALID_GUILD_MEMBER);
				}

				const voiceChannel = interaction.member?.voice?.channel;
				const textChannel = interaction.channel;

				await interaction.deferReply()

				const response = await command.handler({
					context: {
						tonelist,
						interaction,
					},
					input: {
						guildId: interaction.guildId,
						user: interaction.user,
						voiceChannelId: voiceChannel?.id,
						textChannelId: textChannel?.id,
						...args
					}
				});

				await interaction.editReply(response.message ?? '');
			} catch (e) {
				if (isTypedError(e)) {
					await interaction.editReply(e.type);
					return;
				}

				await interaction.editReply('An error occurred: ```' + e + '```');
			}
		}
	});
}

export default initInteractions;