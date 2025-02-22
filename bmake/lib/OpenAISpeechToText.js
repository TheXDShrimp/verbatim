import fs from "fs";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function transcribeAudio(filePath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    console.log("Transcription:", transcription.text);
    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
}

// TESTERS:
// bmake as my working directory, to test do: node lib/OpenAISpeechToText.js

// transcribeAudio("./lib/pranavVoice.mp3");
