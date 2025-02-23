import { generateText } from "@/lib/TwelveLabsVideo";


export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { queryVideoId, prompt } = req.body;
    console.log("Query Video ID:", queryVideoId);

    const text = await generateText(queryVideoId, prompt);
    console.log("Text:", text);

    return res.status(200).json({ text });
}