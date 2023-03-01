import { CommandInteraction, GuildMember } from "discord.js";
import { TonelistCommandErrors } from "../types";

function getMemberVoiceChannel(interaction: CommandInteraction) {
	if (!interaction.member || !(interaction.member as GuildMember).voice.channel) {
		throw new Error(TonelistCommandErrors.CannotGetVoiceChannel);
	}

	const channel = (interaction.member as GuildMember).voice.channel;

	if (!channel) {
		throw new Error(TonelistCommandErrors.CannotGetVoiceChannel);
	}

	return channel;
}

export default getMemberVoiceChannel;