import { isAPIUser } from '../../../types';
import { preValidationAsyncHookHandler, preHandlerHookHandler } from "fastify";

export const authenticate: preValidationAsyncHookHandler = async (request) => {
	if (request.user) {
		return;
	}

	const authorization = request.headers['authorization'];

	if (!authorization) {
		return;
	}

	if (typeof authorization !== 'string') {
		return;
	}

	const [type, token] = authorization.split(' ');

	const user = await fetch('https://discord.com/api/users/@me', {
		headers: {
			authorization: `${type} ${token}`
		}
	})
		.then(res => res.json())
		.catch(err => request.log.error(err))

	if (isAPIUser(user)) {
		request.user = user;
	}
}

export const requiresAuthentication: preHandlerHookHandler = (request, reply, done) => {
	if (!request.user) {
		reply.code(401);
		done(new Error('Unauthorized'));
		return;
	}

	done();
};