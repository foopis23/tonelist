import { FastifyPluginAsync } from "fastify";
import { FromSchema } from "json-schema-to-ts";
import { decode } from "lavaclient";
import ytdl from "ytdl-core";

const getTrackThumbnailSchema = {
	summary: 'Get the thumbnail for a track',
	tags: ['Tracks'],
	query: {
		type: 'object',
		properties: {
			hash: {
				type: 'string',
				description: 'The track hash'
			}
		},
		required: ['hash']
	} as const
};
type GetTrackThumbnailSchema = {
	Querystring: FromSchema<typeof getTrackThumbnailSchema.query>
}

export const trackRoutes: FastifyPluginAsync = async function (fastify) {
	fastify.get<GetTrackThumbnailSchema>('/thumbnail', {
		schema: getTrackThumbnailSchema
	}, async function (request, reply) {

		let track: ReturnType<typeof decode>;
		try {
			track = decode(request.query.hash);
			if (!track || !track.uri) {
				reply.code(400);
				throw new Error('Invalid track hash');
			}
		} catch (e) {
			reply.code(400);
			throw new Error('Invalid track hash');
		}

		const uri = track.uri;

		if (ytdl.validateURL(uri)) {
			const info = await ytdl.getBasicInfo(uri);
			const thumbnail = info.videoDetails.thumbnails[0];
			reply.redirect(thumbnail.url);
		} else {
			reply.code(400);
			throw new Error('Unsupported track source. Only YouTube is supported.')
		}
	});
}
