import { MongoClient } from "mongodb";
import { translateText } from "../../lib/translate";
import { summarizeText } from "../../lib/summarize";
import { generateLipSync } from "@/lib/sync";

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

    const text = '';
    const translatedText = await translateText(text, language);
    const summarizedText = summarize ? await summarizeText(translatedText) : translatedText;
    const output = await generateLipSync(videoUrl, summarizedText);
    

    await collection.insertOne({ videoUrl, language, summarize, user: user.email, output: videoUrl });

    await client.close();

    // return 200 OK
    return res.status(200).json({ status: "ok" });
}