import { REST, Routes } from 'discord.js';
import { Tonelist } from '../tonelist';
import { CommandConfig } from '../types';

// commands
// import Ping from './ping';
import Enqueue from './enqueue';
import List from './list';
import Skip from './skip';
import Previous from './previous';

type InitCommandOptions = {
	token: string;
	clientId: string;
	useTestGuilds?: boolean;
	testGuilds?: string[];
	tonelist: Tonelist;
}

const commands: CommandConfig[] = [
	// Ping,
	Enqueue,
	List,
	Skip,
	Previous
]

async function initCommands(options: InitCommandOptions) {
	const rest = new REST({ version: '10' }).setToken(options.token);
	const commandData = commands.map(command => command.data.toJSON());

	if (options.useTestGuilds) {
		const guilds = options.testGuilds ?? [];
		const guildPromises = guilds.map(guild => rest.put(
			Routes.applicationGuildCommands(options.clientId, guild),
			{ body: commandData }
		));

		await Promise.all(guildPromises);
	} else {
		await rest.put(
			Routes.applicationCommands(options.clientId),
			{ body: commandData }
		);
	}

	options.tonelist.client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;

		const command = commands.find(command => command.data.name === interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction, {
				tonelist: options.tonelist,
			});
		} catch (error) {
			options.tonelist.logger.error(error);

			const msg = (error as Error).message;

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: msg, ephemeral: true });
			} else {
				await interaction.reply({ content: msg, ephemeral: true });
			}
		}
	});
}

export default initCommands;
