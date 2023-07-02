import { ApplicationCommandOptionType, ChatInputCommandInteraction, Interaction, SlashCommandBuilder } from "discord.js";
import { Tonelist } from "../tonelist";
import { ErrorTypes, TypedError, isTypedError } from "../types";
import { CommandArguments, InitCommandOptions, isGuildMember } from "./types";
import { CommandConfig } from "../commands/types";

type CommandBuilder = SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

function getCommandArguments(command: CommandBuilder, interaction: Interaction): CommandArguments {
	const commandInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;

	return command.options.reduce((acc, option) => {
		const optionJSON = option.toJSON();
		switch (optionJSON.type) {
			case ApplicationCommandOptionType.String:
				acc[optionJSON.name] = commandInteraction.options.getString(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Integer:
				acc[optionJSON.name] = commandInteraction.options.getInteger(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Boolean:
				acc[optionJSON.name] = commandInteraction.options.getBoolean(optionJSON.name);
				break;
			case ApplicationCommandOptionType.User:
				acc[optionJSON.name] = commandInteraction.options.getUser(optionJSON.name)
				break;
			case ApplicationCommandOptionType.Channel:
				acc[optionJSON.name] = commandInteraction.options.getChannel(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Role:
				acc[optionJSON.name] = commandInteraction.options.getRole(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Mentionable:
				acc[optionJSON.name] = commandInteraction.options.getMentionable(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Number:
				acc[optionJSON.name] = commandInteraction.options.getNumber(optionJSON.name);
				break;
			case ApplicationCommandOptionType.Attachment:
				acc[optionJSON.name] = commandInteraction.options.getAttachment(optionJSON.name);
				break;
			default:
				break;
		}

		return acc;
	}, {})
}

function createCommandBuilders(commands: Record<string, CommandConfig>): Record<string, CommandBuilder> {
	return Object.entries(commands).map(([name, command]) => {
		let builder: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> = new SlashCommandBuilder()
			.setName(name)
			.setDescription(command.summary);

		const commandArgs = Object.entries(command.args).filter(([, arg]) => !!arg.command);

		for (const [argName, arg] of commandArgs) {
			switch (arg.type) {
				case 'string':
					builder = builder.addStringOption(option =>
						option
							.setName(argName)
							.setRequired(!!arg.required)
							.setDescription(arg.summary)
					);
					break;
				case 'number':
					builder = builder.addNumberOption(option =>
						option
							.setName(argName)
							.setRequired(!!arg.required)
							.setDescription(arg.summary)
					);
					break;
				case 'boolean':
					builder = builder.addBooleanOption(option =>
						option
							.setName(argName)
							.setRequired(!!arg.required)
							.setDescription(arg.summary)
					);
					break;
			}
		}

		return builder;
	}).reduce((acc: Record<string, CommandBuilder>, builder) => {
		acc[builder.name] = builder;
		return acc;
	}, {});
}

async function registerCommands(tonelist: Tonelist, builders: Record<string, CommandBuilder>, testGuilds: string[]) {
	const applicationCommandManager = tonelist.client.application.commands;
	if (!applicationCommandManager) {
		throw new Error('Application command manager not found');
	}
	const listOfBuilders = Object.values(builders);
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
	const builders = createCommandBuilders(options.commands);
	await registerCommands(tonelist, builders, options.testGuilds ?? []);

	tonelist.client.on('interactionCreate', async (interaction) => {
		if (!interaction.isCommand()) {
			return;
		}

		const command = options.commands[interaction.commandName];
		const builder = builders[interaction.commandName];
		if (!builder) {
			return;
		}

		try {
			const commandInteraction = interaction as ChatInputCommandInteraction;
			const args = getCommandArguments(builder, interaction);

			if (!isGuildMember(commandInteraction.member)) {
				throw new TypedError(ErrorTypes.INVALID_GUILD_MEMBER);
			}

			const voiceChannel = commandInteraction.member?.voice?.channel;
			const textChannel = commandInteraction.channel;

			await commandInteraction.deferReply()

			const response = await command.handler({
				guildId: commandInteraction.guildId,
				tonelist,
				user: commandInteraction.user,
				voiceChannelId: voiceChannel.id,
				textChannelId: textChannel.id,
				interaction: commandInteraction,
				...args
			});

			await commandInteraction.editReply(response.message);
		} catch (e) {
			if (isTypedError(e)) {
				await interaction.editReply(e.type);
				return;
			}

			await interaction.editReply('An error occurred: ```' + e + '```');
		}
	});
}

export default initInteractions;