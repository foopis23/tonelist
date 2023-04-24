import { ChannelManager, GuildManager, GuildMemberManager, RoleManager, UserManager } from "discord.js";

type Managers = UserManager | GuildManager | GuildMemberManager | ChannelManager | RoleManager;
type ReturnTypes = ReturnType<UserManager['cache']['get']>
	| ReturnType<GuildManager['cache']['get']>
	| ReturnType<GuildMemberManager['cache']['get']>
	| ReturnType<ChannelManager['cache']['get']>
	| ReturnType<RoleManager['cache']['get']>;

export async function getItem<V extends ReturnTypes = ReturnTypes>(manager: Managers, id: string): Promise<V> {
	const item = manager.cache.get(id);

	if (item) {
		return item as V;
	}

	return await manager.fetch(id) as V | null;
}
