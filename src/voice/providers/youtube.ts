import { createAudioResource, StreamType } from "@discordjs/voice";
import ytdl from "ytdl-core";
import { AudioProvider } from "../../types";

const Youtube: AudioProvider = {
	getAudioResourceFromURI: async (songURI: string) => {
		const info = await ytdl.getInfo(songURI);
		const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

		if (!format) {
			throw new Error('No audio format found');
		}

		const audioResourceSettings = {
			inputType: StreamType.Arbitrary,
		};

		switch (format.container) {
			case 'webm':
				audioResourceSettings.inputType = StreamType.WebmOpus;
				break;
			default:
				audioResourceSettings.inputType = StreamType.Arbitrary;
				break;
		}

		const audioStream = ytdl(songURI, {
			filter: 'audioonly',
			format: format
		});

		return createAudioResource(audioStream, audioResourceSettings);
	},
	isValidURI: (songURI: string) => {
		return ytdl.validateURL(songURI);
	}
}

export default Youtube;