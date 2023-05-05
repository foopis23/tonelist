import { Authenticator } from "@fastify/passport";
import { FastifyPluginAsync } from "fastify";
import { EnvConfig } from "../envConfig";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { APIUser } from "discord.js";
import { User } from "@prisma/client";
import OAuth2Strategy from "passport-oauth2";
import fp from "fastify-plugin";
import fastifySession from "@fastify/session";
import fastifyCookie from "@fastify/cookie";

declare module 'fastify' {
	interface PassportUser {
		id: string;
		username: string;
		avatar?: string;
		accessToken?: string;
		refreshToken?: string;
		createdAt: Date;
		updatedAt: Date;
	}
}

const auth: FastifyPluginAsync<{ env: EnvConfig }> = async (fastify, { env }) => {
	const fastifyPassport = new Authenticator();
	fastify.register(fastifyCookie);
	fastify.register(fastifySession, {
		secret: env.AUTH_SECRET,
		cookie: {
			secure: false,
			maxAge: 24 * 60 * 60 * 1000,
			sameSite: 'lax',
		},
		saveUninitialized: false,
		store: new PrismaSessionStore(
			fastify.prisma,
			{
				checkPeriod: 2 * 60 * 1000, //ms
				dbRecordIdIsSessionId: true,
				dbRecordIdFunction: undefined,
			}
		)
	});
	fastify.register(fastifyPassport.initialize())
	fastify.register(fastifyPassport.secureSession())
	fastifyPassport.registerUserSerializer<APIUser, string>(
		async (user) => user.id
	);
	fastifyPassport.registerUserDeserializer<string, User | null>(
		async (userId) => await fastify.prisma.user.findUnique({
			where: {
				id: userId
			}
		})
	);
	fastifyPassport.use('discord', new OAuth2Strategy({
		authorizationURL: 'https://discord.com/oauth2/authorize',
		tokenURL: 'https://discord.com/api/oauth2/token',
		clientID: env.DISCORD_CLIENT_ID,
		clientSecret: env.DISCORD_CLIENT_SECRET,
		callbackURL: 'http://localhost:3000/api/auth/discord/callback',
		scope: ['identify', 'guilds'],
	}, async (accessToken: string, refreshToken: string, _profile: unknown, cb: (err: unknown, user?: unknown) => void) => {
		const me = await fetch('https://discord.com/api/users/@me', {
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		}).then(res => res.json() as unknown as APIUser)

		const user = await fastify.prisma.user.upsert({
			where: {
				id: me.id
			},
			update: {
				accessToken,
				refreshToken,
				username: me.username,
				avatar: me.avatar,
			},
			create: {
				id: me.id,
				accessToken,
				refreshToken,
				username: me.username,
				avatar: me.avatar,
			}
		})

		cb(null, user);
		return user;
	}))


	fastify.get('/api/auth/discord', {
		preValidation: fastifyPassport.authenticate('discord', { scope: ['identify', 'guilds'] }),
	}, async () => 'hello world');

	fastify.get('/api/auth/discord/callback', {
		preValidation: fastifyPassport.authenticate('discord', { failureRedirect: '/login' })
	}, (_req, res) => {
		res.redirect('/');
	})

	fastify.get('/api/auth/logout', async (req, res) => {
		await req.session.destroy();
		res.redirect('/');
	})
}

export default fp(auth);