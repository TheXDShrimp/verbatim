import { generateLipSync } from "./sync.js";
import { createVoiceFromMP4, deleteVoice } from "./voiceclone.js";

// Example usage
const mp4Url = 'https://dl.dropboxusercontent.com/scl/fi/lcmffmz6pz5sv6t22kvp2/FOXNEWS.mp4?rlkey=6173prvixzn8zvr6i878t68oa&st=bg85scq9&dl=0';
const outputMp3Path = 'output.mp3';
const name = 'Alex';

let voiceId;

createVoiceFromMP4(mp4Url, outputMp3Path, name)
    .then(id => {
        voiceId = id;
        console.log('Voice creation response:', voiceId);
        return generateLipSync(mp4Url, 'There once was a ship that took to sea, the name of the ship was a large bunch of tea', voiceId);
    })
    .then(outputUrl => {
        console.log('Final Output URL:', outputUrl);
        return deleteVoice(voiceId);
    })
    .then(() => {
        console.log('Voice deleted successfully');
    })
    .catch(error => console.error('Error:', error));