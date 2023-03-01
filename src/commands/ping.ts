import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "../types";

const Ping: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with pong!'),
	execute: async (interaction) => {
		await interaction.reply('Pong!');
	}
}

export default Ping;