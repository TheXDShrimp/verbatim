import { MongoClient, ObjectId } from "mongodb";
import { deleteVideo } from "../../lib/TwelveLabsVideo";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { videoId, user, queryVideoId } = req.body;
    // console.log("User:", user);

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("speakerize");
    const collection = db.collection("videos");
    const query_collection = db.collection("query_models");

    // Delete the video from twelve labs
    console.log(queryVideoId);
    const query_models = await query_collection.find({ user: user.email }).toArray();
    const twelveResult = await deleteVideo(query_models[0].indexId, queryVideoId);
    console.log("TWELVE LABS DELETE VIDEO");
    console.log(twelveResult === undefined);

    // Delete the video from mongo db with the given ID
    const result = await collection.deleteOne({ _id: new ObjectId(videoId) });

    await client.close();

    if (result.deletedCount === 1) {
        return res.status(200).json({ message: "Video deleted successfully" });
    } else {
        return res.status(404).json({ error: "Video not found" });
    }
}