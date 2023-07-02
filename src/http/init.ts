import Fastify from 'fastify';
import { Tonelist } from '../tonelist';
import fastifyVite from './vite';
import { resolve } from 'path';
import { EnvConfig } from '../envConfig';
import { Authenticator } from '@fastify/passport'
import OAuth2Strategy from 'passport-oauth2';
import { APIUser } from 'discord.js';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { PrismaClient, User } from '@prisma/client';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

declare module 'fastify' {
	interface FastifyInstance {
		tonelist: Tonelist;
		prisma: PrismaClient;
	}

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

type InitAPIOptions = {
	tonelist: Tonelist,
	env: EnvConfig
	prisma: PrismaClient
}

async function initHTTPServer({ tonelist, env, prisma }: InitAPIOptions) {
	const logger = tonelist.logger?.child({ module: 'api' });
	const fastify = Fastify({
		logger: logger,
	});

	// decorate fastify with resources
	fastify.decorate('tonelist', tonelist);
	fastify.decorate('prisma', prisma);

	// authentication
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
			prisma,
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
	fastifyPassport.registerUserDeserializer<string, User>(
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
	}, async (accessToken: string, refreshToken: string, profile: unknown, cb: (err: unknown, user?: unknown) => void) => {
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
	}, (req, res) => {
		res.redirect('/');
	})

	fastify.get('/api/auth/logout', async (req, res) => {
		await req.session.destroy();
		res.redirect('/');
	})

	fastify.get('/api/users/me', async (req) => {
		return req.user;
	})

	fastify.register(fastifyVite, {
		root: resolve(__dirname, '../client'),
		printViteDevServerHost: true,
	})

	try {
		await fastify.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

export default initHTTPServer;