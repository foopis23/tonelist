import { ClientOptions } from "discord.js";
import { LoggerOptions } from "pino";
import { ConnectionInfo } from "lavaclient";

export type InitOptions = {
	loggerOptions?: LoggerOptions,
	clientOptions?: Partial<ClientOptions>,
	token: string;
	clientId: string;
	lavaConnectionInfo: ConnectionInfo;
}

