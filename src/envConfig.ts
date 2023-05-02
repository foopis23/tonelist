import zod from 'zod';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({
	path: resolve(__dirname, '../.env'),
	override: true
});

const envSchema = zod.object({
	NODE_ENV: zod.enum(['development', 'production', 'test']).default('development'),
	LAVA_HOST: zod.string().default('localhost'),
	LAVA_PORT: zod.number().default(2333),
	LAVA_PASSWORD: zod.string().default('youshallnotpass'),
	LOG_LEVEL: zod.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
	DISCORD_TOKEN: zod.string().nonempty(),
	DISCORD_CLIENT_ID: zod.string().nonempty(),
	DISCORD_CLIENT_SECRET: zod.string().nonempty(),
	BOT_TEST_GUILDS: zod.string().default('').transform((val) => (val.length) ? val.split(',') : []),
});
export type EnvConfig = zod.infer<typeof envSchema>;

const envConfig = envSchema.parse(process.env);
export default envConfig;