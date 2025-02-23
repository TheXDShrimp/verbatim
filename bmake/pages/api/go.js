import { MongoClient } from "mongodb";
import { translateText } from "../../lib/translate.js";
import { summarizeText } from "../../lib/summarize.js";
import { syncVideo } from "@/lib/sync-and-clone";
import { createModel, uploadVideoFromUrl, generateMetadata, formatTime, generateText, searchQuery } from "@/lib/TwelveLabsVideo";
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

    const query_collection = db.collection("query_models");

    // find all with user.email
    const query_models = await query_collection.find({ user: user.email }).toArray();
    console.log("Query Model IDs:", query_models);

    // Check if data is empty and create a new model if necessary
    if (query_models.length === 0) {
        console.log("No query models found, creating a new model...");
        const queryIndexId = await createModel(`Model_${user.email}`);
        query_collection.insertOne({ user: user.email, indexId: queryIndexId });
        console.log("New model created:", newModel);
    } else {
        console.log("Query models found, using existing model...");
        const queryIndexId = query_models[0].indexId;
    }

    const queryVideoId = await uploadVideoFromUrl(videoUrl);
    const videoTitle = (await generateMetadata(queryVideoId)).title;
    console.log("Video Title:", videoTitle);

  // TODO: get video to text (ask Pranav Neti)

  const text = await transcribeAudio(videoUrl);
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
  , queryIndexId, queryVideoId, videoTitle);
  await collection.insertOne({
    videoUrl,
    language,
    summarize,
    user: user.email,
    output: output, 
    queryIndexId, 
    queryVideoId, 
    videoTitle });

  await client.close();

  // return 200 OK
  return res.status(200).json({ status: "ok" });
}
