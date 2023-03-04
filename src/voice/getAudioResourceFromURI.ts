import { AudioProvider } from '../types'
import Youtube from './providers/youtube'

const providers : AudioProvider[] = [
	Youtube
]

function getAudioResourceFromURI(songURI: string) {
	for (const provider of providers) {
		if (provider.isValidURI(songURI)) {
			return provider.getAudioResourceFromURI(songURI);
		}
	}

	throw new Error('Invalid song URI');
}

export default getAudioResourceFromURI;