import { FastifyPluginCallback } from "fastify";
import { authenticate } from "./hooks";
import fp from "fastify-plugin";

const plugin: FastifyPluginCallback = (fastify, opts, done) => {
	fastify.decorateRequest('user', null);
	fastify.addHook('preValidation', authenticate);
	done();
}

export const discordTokenAuth = fp(plugin);
