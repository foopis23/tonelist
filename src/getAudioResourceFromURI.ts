import { TonelistErrors } from "./types";
import { createAudioResource } from "@discordjs/voice";
import fs from 'fs';

async function convertURIToAudioResource(songURI: string) {
	// validate song uri is file path
	// create audio resource
	try {
		await fs.promises.access(songURI, fs.constants.R_OK)
	} catch (err) {
		throw new Error(TonelistErrors.InvalidSongURI);
	}

	return createAudioResource(fs.createReadStream(songURI));
}

export default convertURIToAudioResource;