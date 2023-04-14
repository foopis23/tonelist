import { APIUser } from "discord.js";
import { discordTokenAuth } from "./plugin";

declare module 'fastify' {
	interface FastifyRequest {
		user: APIUser | null;
	}
}

export { requiresAuthentication } from "./hooks";
export default discordTokenAuth;