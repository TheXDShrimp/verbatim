import { MongoClient } from "mongodb";
import { translateText } from "../../lib/translate.js";
import { summarizeText } from "../../lib/summarize.js";
import { syncVideo } from "@/lib/sync-and-clone";
import { transcribeAudio } from "@//lib/OpenAISpeechToText";
import { youtubeCaptions } from "@//lib/YoutubeCaptions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { videoUrl, language, summarize, user } = req.body;
  console.log("User:", user);

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("speakerize");
  const collection = db.collection("videos");

  // TODO: get video to text (ask Pranav Neti)

  const text = transcribeAudio(videoUrl);
  const translatedText = await translateText(text, language);
  const summarizedText = summarize
    ? await summarizeText(translatedText)
    : translatedText;
  const output = await syncVideo(videoUrl, summarizedText);

  console.log(
    "Putting into db:",
    videoUrl,
    language,
    summarize,
    user.email,
    output
  );
  await collection.insertOne({
    videoUrl,
    language,
    summarize,
    user: user.email,
    output: output,
  });

  await client.close();

  // return 200 OK
  return res.status(200).json({ status: "ok" });
}
