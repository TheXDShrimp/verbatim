import axios from "axios";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import { spawn } from 'child_process';
import { ElevenLabsClient } from "elevenlabs";
import 'dotenv/config';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
console.log('ELEVENLABS_API_KEY:', ELEVENLABS_API_KEY);
const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
ffmpeg.setFfmpegPath(ffmpegPath);

export async function addVoiceFromMP3(audio_file, name) {
    try {
        console.log('Adding voice from MP3:', audio_file, 'with name:', name);
        const response = await client.voices.add({
            files: [fs.createReadStream(audio_file)],
            name: name
        });
        console.log('Response:', response);
        const id = response.voice_id;
        console.log('Response ID:', id);
        return id;
    } catch (error) {
        console.error('Error adding voice:', error);
        throw error;
    }
}

export async function deleteVoice(voiceId) {
    try {
        console.log('Deleting voice:', voiceId);
        const response = await client.voices.delete(voiceId);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error deleting voice:', error);
        throw error;
    }
}

export async function createVoiceFromMP4(mp4Url, outputMp3Path, name) {
    const tempMp4Path = 'temp.mp4';
    try {
        console.log('Downloading MP4 from URL:', mp4Url);
        const response = await axios.get(mp4Url, { responseType: 'stream' });
        const mp4Stream = response.data;

        // Save MP4 stream to a temporary file
        const tempFile = fs.createWriteStream(tempMp4Path);
        mp4Stream.pipe(tempFile);

        await new Promise((resolve, reject) => {
            tempFile.on('finish', resolve);
            tempFile.on('error', reject);
        });

        console.log('Extracting audio from MP4...');
        await new Promise((resolve, reject) => {
            const ffmpegProcess = spawn(ffmpegPath, ['-i', tempMp4Path, '-vn', '-acodec', 'libmp3lame', outputMp3Path]);

            let ffmpegError = '';

            ffmpegProcess.stderr.on('data', (data) => {
                ffmpegError += data.toString();
            });

            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Audio extraction completed');
                    resolve();
                } else {
                    console.error('FFmpeg process exited with code', code);
                    console.error('FFmpeg error output:', ffmpegError);
                    reject(new Error(`FFmpeg process exited with code ${code}`));
                }
            });

            ffmpegProcess.on('error', (err) => {
                console.error('Error during audio extraction:', err);
                reject(err);
            });
        });

        console.log('Audio extracted successfully to:', outputMp3Path);
        const voiceResponse = await addVoiceFromMP3(outputMp3Path, name);

        // Delete the temporary MP4 file
        fs.unlink(tempMp4Path, (err) => {
            if (err) {
                console.error('Error deleting temporary MP4 file:', err);
            } else {
                console.log('Temporary MP4 file deleted successfully');
            }
        });

        // Delete the MP3 file
        fs.unlink(outputMp3Path, (err) => {
            if (err) {
                console.error('Error deleting MP3 file:', err);
            } else {
                console.log('MP3 file deleted successfully');
            }
        });

        return voiceResponse;
    } catch (error) {
        console.error('Error extracting audio:', error);
        throw error;
    } finally {
        // Ensure the temporary MP4 file is deleted in case of an error
        fs.unlink(tempMp4Path, (err) => {
            if (err) {
                console.error('Error deleting temporary MP4 file:', err);
            }
        });
    }
}