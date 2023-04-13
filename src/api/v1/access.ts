import { APIUser, Guild, GuildMember } from "discord.js";
import { getItem } from "../../util";
import { Tonelist } from "../../tonelist";

export async function userHasGuildAccess({ user, guildID, tonelist }: { user: APIUser | null, guildID: string, tonelist: Tonelist }): Promise<boolean> {
	if (!user) {
		return false;
	}

	const guild = await getItem<Guild>(tonelist.client.guilds, guildID);

	if (!guild) {
		return false;
	}

	const member = getItem<GuildMember>(guild.members, user.id);

	if (!member) {
		return false;
	}

	return true;
}
