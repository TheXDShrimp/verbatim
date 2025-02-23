import { MongoClient } from "mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { user } = req.body;
    console.log("User:", user);

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("speakerize");
    const collection = db.collection("videos");

    // find all with user.email
    const videos = await collection.find({ user: user.email }).toArray();
    // console.log("Videos:", videos);

    await client.close();

    // return videos
    return res.status(200).json(videos);
}