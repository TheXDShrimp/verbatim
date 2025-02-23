import { MongoClient } from "mongodb";
import { translateText } from "../../lib/translate.js";
import { summarizeText } from "../../lib/summarize.js";
import { syncVideo } from "@/lib/sync-and-clone";
import { createModel, uploadVideoFromUrl, generateMetadata, formatTime, generateText, searchQuery } from "@/lib/TwelveLabsVideo";
import { transcribeAudio } from "@//lib/OpenAISpeechToText";

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
    let queryIndexId;
    if (query_models.length === 0) {
        console.log("No query models found, creating a new model...");
        queryIndexId = (await createModel(`MyModel_${user.email}`));
        queryIndexId = queryIndexId.id;
        query_collection.insertOne({ user: user.email, indexId: queryIndexId });
    } else {
        console.log("Query models found, using existing model...");
        queryIndexId = query_models[0].indexId;
    }

    console.log("Upload video from URL:", videoUrl);
    const queryVideoId = await uploadVideoFromUrl(videoUrl, queryIndexId);
    let videoTitle = await generateMetadata(queryVideoId);
    videoTitle = videoTitle.title;
    console.log("Video Title:", videoTitle);

    // Generate text from video
    const text = await transcribeAudio(videoUrl);
    console.log("Transcribed text:", text);

    const englishText = await translateText(text, "english");
    console.log("Translated text:", englishText);

    const summarizedText = summarize ? await summarizeText(englishText) : englishText;
    console.log("Summarized text:", summarizedText);

    const finalText = await translateText(summarizedText, language);
    console.log("Final text:", finalText);
    console.log();

    const output = await syncVideo(videoUrl, finalText);

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
