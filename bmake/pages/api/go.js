
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { videoUrl, language, summarize, user } = req.body;
    console.log("User:", user);

    // return 200 OK
    res.status(200).json({ status: "ok" });

}