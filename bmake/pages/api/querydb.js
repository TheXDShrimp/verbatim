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
    const collection = db.collection("query_models");

    // find all with user.email
    const query_models = await collection.find({ user: user.email }).toArray();
    console.log("Query Model IDs:", query_models);

    await client.close();

    // return videos
    return res.status(200).json(query_models);
}