import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember, Interaction } from "discord.js";
import { Tonelist } from "../tonelist";
import { TonelistErrorType } from "../types";
import Enqueue from "./enqueue";
import List from "./list";
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
		Ping,
		Enqueue,
		List
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
			const commandInteraction = interaction as ChatInputCommandInteraction;
			const args = getCommandArguments(command, interaction);
			const voiceChannel = (commandInteraction.member as GuildMember)?.voice?.channel;
			const textChannel = commandInteraction.channel;
			await command.execute({ interaction: commandInteraction, tonelist, args, voiceChannel, textChannel });
		} catch (e) {
			if (e.type) {
				switch (e.type) {
					case TonelistErrorType.ALREADY_CONNECTED:
						await interaction.editReply('Already connected to a voice channel');
						return;
					case TonelistErrorType.NOT_CONNECTED:
						await interaction.editReply('Not connected to a voice channel');
						return;
					case TonelistErrorType.INDEX_OUT_OF_BOUNDS:
						await interaction.editReply('Index needs to be between 0 and the queue length');
						return;
				}
			}

			if (interaction.deferred || interaction.replied) {
				await interaction.editReply('An error occurred: ' + e.message || 'Unknown error');
			} else {
				await interaction.reply('An error occurred: ' + e.message || 'Unknown error');
			}
		}
	});
}

export default initCommands;