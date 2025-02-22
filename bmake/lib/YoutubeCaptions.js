import { YoutubeTranscript } from "youtube-transcript";

export async function fetchYouTubeTranscript(videoUrl) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
    console.log(transcript);
    return transcript;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

// TESTERS:
// bmake as my working directory, to test do: node lib/YoutubeCaptions.js

// fetchYouTubeTranscript(
//   "https://www.youtube.com/watch?v=fsfLg29631I&ab_channel=7Man"
// );
