import { ApplicationCommandOptionType, ChatInputCommandInteraction, Interaction } from "discord.js";
import { Tonelist } from "../tonelist";
import Ping from "./ping";
import { CommandArguments, CommandConfig, InitCommandOptions } from "./types";

async function registerCommands(tonelist: Tonelist, options: InitCommandOptions, commands: CommandConfig[]) {
	const applicationCommandManager = tonelist.client.application.commands;

	if (!applicationCommandManager) {
		throw new Error('Application command manager not found');
	}

	const commandData = commands.map(command => command.data);
	await applicationCommandManager.set(commandData);

	if (options.testGuilds && options.testGuilds.length > 0) {
		const guildResults = await Promise.allSettled(options.testGuilds.map(guildId => tonelist.getGuild(guildId)));

		for (const guildResult of guildResults) {
			if (guildResult.status === 'fulfilled') {
				const guild = guildResult.value;
				await guild.commands.set(commandData);
			}
		}
	}
}

function getCommandArguments(command: CommandConfig, interaction: Interaction): CommandArguments {
	const commandInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;

	return command.data.options.reduce((acc, option) => {
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

async function initCommands(tonelist: Tonelist, options: InitCommandOptions) {
	const commands: CommandConfig[] = [
		Ping
	];

	await registerCommands(tonelist, options, commands);

	tonelist.client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) {
			return;
		}

		const command = commands.find(command => command.data.name === interaction.commandName);
		if (!command) {
			return;
		}

		try {
			const options = getCommandArguments(command, interaction);
			await command.execute(interaction as ChatInputCommandInteraction, options);
		} catch (e) {
			console.error(e);
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	});
}

export default initCommands;