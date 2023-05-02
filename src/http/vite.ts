import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import Vite from "vite";
import { resolve } from "path";
import FastifyStatic from "@fastify/static";
import { createReadStream } from 'fs';

interface FastifyViteConfig extends FastifyPluginOptions {
	dev?: boolean;
	vitePort?: number;
	viteServerSecure?: boolean;
	printViteDevServerHost?: boolean;
	root?: string;
	redirectNotFoundToIndex?: boolean;
}

const DEFAULT_CONFIG: FastifyViteConfig = {
	dev: process.env.NODE_ENV !== 'production',
	vitePort: 5173,
	viteServerSecure: false,
	printViteDevServerHost: false,
	root: resolve(__dirname, './client'),
	redirectNotFoundToIndex: true,
};

function isStaticFilePath(path: string) {
	return path.match(/(\.\w+$)|@vite|@id|@react-refresh|@fs/);
}

const fastifyVite: FastifyPluginAsync<FastifyViteConfig> = async (fastify, opts = DEFAULT_CONFIG) => {
	// setup config with defaults
	const config = { ...DEFAULT_CONFIG, ...opts };

	// if is development, start dev server
	if (config.dev) {
		const devServer = await Vite.createServer({
			root: config.root,
			server: {
				port: config.vitePort,
			}
		});
		await devServer.listen()

		if (config.printViteDevServerHost) {
			devServer.printUrls();
		}

		fastify.server.on('close', () => { devServer.close() });
	}

	// get vite config
	const viteConfig = await Vite.resolveConfig({
		root: config.root,
	}, (config.dev) ? 'serve' : 'build');
	const viteHost = `${config.viteServerSecure ? 'https' : 'http'}://localhost:${config.vitePort}`;
	console.log(viteHost)

	// serve static files
	if (!config.dev) {
		const distPath = resolve(config.root, viteConfig.build.outDir)
		fastify.register(FastifyStatic, {
			root: distPath,
		})

		fastify.log.info(`Server static files from ${distPath}`)
	} else {
		fastify.addHook('preHandler', (request, reply, next) => {
			if (isStaticFilePath(request.url)) {
				fetch(new URL(request.url, viteHost)).then(async (viteResponse) => {
					if (!viteResponse.ok) return next();

					viteResponse.headers.forEach((value, key) => reply.header(key, value));

					if (request.url.match(/@vite\/client/)) {
						const text = await viteResponse.text();
						return reply.send(
							text.replace(/hmrPort = null/, `hmrPort = ${config.vitePort}`)
						)
					}

					return reply.send(await viteResponse.text());
				})
			} else {
				next();
			}
		})
	}

	// serve index.html
	if (config.dev) {
		const handler  = (_: FastifyRequest, reply: FastifyReply) => {
			fetch(new URL(viteHost)).then(async (viteResponse) => {
				reply.status(viteResponse.status);
				viteResponse.headers.forEach((value, key) => reply.header(key, value));
				reply.send(await viteResponse.text());
			});
		}
		fastify.all('/', handler)
		if (config.redirectNotFoundToIndex) {
			fastify.setNotFoundHandler(handler);
		}
	} else {
		const handler = (_: FastifyRequest, reply: FastifyReply) => {
			reply.send(createReadStream(resolve(config.root, viteConfig.build.outDir, 'index.html')))
		}

		fastify.all('/', handler)
		if (config.redirectNotFoundToIndex) {
			fastify.setNotFoundHandler(handler);
		}
	}
};

export default fp(fastifyVite);
