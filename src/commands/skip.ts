import { SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "./types";

const Skip: CommandConfig = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current track'),
	async execute({ interaction, tonelist }) {
		const { skipped } = await tonelist.skip({
			guildId: interaction.guildId
		});

		await interaction.reply(`Skipped ${skipped.title}`);
	}
}

export default Skip;