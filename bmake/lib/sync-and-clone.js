import { generateLipSync } from "./sync.js";
import { createVoiceFromMP4, deleteVoice } from "./voiceclone.js";

export async function syncVideo(videoUrl, text) {
    if (videoUrl.startsWith('https://www.dropbox.com')) {
        videoUrl = videoUrl.replace('https://www.dropbox.com', 'https://dl.dropboxusercontent.com');
    }
    const mp4Url = videoUrl;
    const outputMp3Path = 'output.mp3';
    const name = 'Alex';

    let voiceId;
    let outputUrl;

    try {
        voiceId = await createVoiceFromMP4(mp4Url, outputMp3Path, name);
        console.log('Voice creation response:', voiceId);

        outputUrl = await generateLipSync(mp4Url, text, voiceId);
        console.log('Final Output URL:', outputUrl);

        await deleteVoice(voiceId);
        console.log('Voice deleted successfully');

        return outputUrl;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

let videoUrl = 'https://www.dropbox.com/scl/fi/lcmffmz6pz5sv6t22kvp2/FOXNEWS.mp4?rlkey=6173prvixzn8zvr6i878t68oa&st=2xosyahn&dl=0'
let text = 'There once was a ship that took to sea, the name of the ship was a large bunch of tea'

syncVideo(videoUrl, text)
    .then(outputUrl => {
        console.log('Output URL:', outputUrl);
    })
    .catch(error => {
        console.error('Error:', error);
    });

