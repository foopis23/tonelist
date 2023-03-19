import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Enqueue: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('enqueue')
		.setDescription('Enqueue a song')
		.addStringOption(option => option.setName('query').setDescription('The query to enqueue').setRequired(true)),
	execute: async (interaction, args) => {
		await interaction.reply(`Enqueued! ${args.query}`);
	}
}

export default Enqueue;
