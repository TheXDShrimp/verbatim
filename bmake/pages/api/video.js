import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { videoId } = req.body;

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("speakerize");
    const collection = db.collection("videos");

    // find videoId as ObjectID
    const video = await collection.findOne({ _id: new ObjectId(videoId) });
    console.log("Videos:", video);

    await client.close();

    // return videos
    return res.status(200).json(video);
}