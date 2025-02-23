import fs from "fs";
import OpenAI from "openai";
import "dotenv/config";
import axios from "axios";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function transcribeAudio(videoUrl) {
  const tempMp4Path = "../tmp/openAISTTTemp.mp4";
  const outputMp3Path = "../tmp/openAISTTTemp.mp3";
  try {
    console.log("Downloading MP4 from URL:", videoUrl);
    const response = await axios.get(videoUrl, { responseType: "stream" });
    const mp4Stream = response.data;

    // Save MP4 stream to a temporary file
    const tempFile = fs.createWriteStream(tempMp4Path);
    mp4Stream.pipe(tempFile);

    await new Promise((resolve, reject) => {
      tempFile.on("finish", resolve);
      tempFile.on("error", reject);
    });

    console.log("Extracting audio from MP4...");
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

    console.log("Audio extracted successfully to:", outputMp3Path);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputMp3Path),
      model: "whisper-1",
    });

    console.log("Transcription:", transcription.text);

    // Delete the temporary MP4 file
    fs.unlink(tempMp4Path, (err) => {
      if (err) {
        console.error("Error deleting temporary MP4 file:", err);
      } else {
        console.log("Temporary MP4 file deleted successfully");
      }
    });

    // Delete the MP3 file
    fs.unlink(outputMp3Path, (err) => {
      if (err) {
        console.error("Error deleting MP3 file:", err);
      } else {
        console.log("MP3 file deleted successfully");
      }
    });

    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
}

// TESTERS:
// bmake as my working directory, to test do: node lib/OpenAISpeechToText.js

// transcribeAudio(
//   "https://dl.dropboxusercontent.com/scl/fi/lcmffmz6pz5sv6t22kvp2/FOXNEWS.mp4?rlkey=6173prvixzn8zvr6i878t68oa&st=2xosyahn&dl=0"
// );
