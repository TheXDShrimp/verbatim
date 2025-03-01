import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { videoId } = req.body;
    // console.log("User:", user);

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("speakerize");
    const collection = db.collection("videos");

    // Delete the video with the given ID
    const result = await collection.deleteOne({ _id: new ObjectId(videoId) });

    await client.close();

    if (result.deletedCount === 1) {
        return res.status(200).json({ message: "Video deleted successfully" });
    } else {
        return res.status(404).json({ error: "Video not found" });
    }
}