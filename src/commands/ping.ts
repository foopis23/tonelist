import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Ping: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addStringOption(option => option.setName('input').setDescription('The input to echo back')),

	execute: async (interaction, args) => {
		console.log(args);
		await interaction.reply(`Pong! ${args.input}`);
	}
}

export default Ping;
