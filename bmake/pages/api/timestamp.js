import { searchQuery } from "@/lib/TwelveLabsVideo";


export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { queryIndexId, prompt, queryVideoId } = req.body;
    console.log("Query Video ID:", queryVideoId);

    const response = await searchQuery(queryIndexId, prompt, false, queryVideoId);
    
    // Find the result with the highest score where videoId matches queryVideoId
    const matchingResult = response
        .filter(result => result.videoId === queryVideoId)
        .reduce((max, result) => (result.score > max.score ? result : max), { score: -Infinity });
    
    console.log("Matching result:", matchingResult);
    if (matchingResult.score !== -Infinity) {
        return res.status(200).json(matchingResult);
    } else {
        return res.status(404).json({ error: "No matching videoId found" });
    }
}