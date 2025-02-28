import { MongoClient, ObjectId } from "mongodb";
import { translateText } from "../../lib/translate.js";
import { summarizeText } from "../../lib/summarize.js";
import { startSyncVideo, checkSyncVideoStatus } from "@/lib/sync-and-clone";
import { createModel, uploadVideoFromUrl, generateMetadata, formatTime, generateText, searchQuery } from "@/lib/TwelveLabsVideo";
import { transcribeAudio } from "@//lib/OpenAISpeechToText";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { videoUrl, language, summarize, user, jobId } = req.body;
        
        // Connect to MongoDB
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        const db = client.db("speakerize");
        const collection = db.collection("videos");
        const jobsCollection = db.collection("sync_jobs");
        const query_collection = db.collection("query_models");
        
        try {
            // If a jobId is provided, check the status of an existing job
            if (jobId) {
                const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
                
                if (!job) {
                    await client.close();
                    return res.status(404).json({ error: "Job not found" });
                }
                
                // Check the current status
                const statusResult = await checkSyncVideoStatus(job);
                
                // Update job in database
                await jobsCollection.updateOne(
                    { _id: new ObjectId(jobId) },
                    { $set: statusResult }
                );
                
                if (statusResult.status === 'COMPLETED') {
                    // Job is complete, update the main videos collection
                    await collection.insertOne({
                        videoUrl: job.videoUrl,
                        language: job.language,
                        summarize: job.summarize,
                        user: job.user,
                        output: statusResult.outputUrl,
                        queryIndexId: job.queryIndexId,
                        queryVideoId: job.queryVideoId,
                        videoTitle: job.videoTitle
                    });
                    
                    // Delete the job
                    await jobsCollection.deleteOne({ _id: new ObjectId(jobId) });
                    
                    await client.close();
                    return res.status(200).json({ 
                        status: "COMPLETED", 
                        outputUrl: statusResult.outputUrl 
                    });
                } else if (statusResult.status === 'ERROR') {
                    // Delete the job on error
                    await jobsCollection.deleteOne({ _id: new ObjectId(jobId) });
                    
                    await client.close();
                    return res.status(500).json({ 
                        status: "ERROR", 
                        error: statusResult.error 
                    });
                } else {
                    // Still processing, return current status
                    await client.close();
                    return res.status(202).json({ 
                        status: "PROCESSING", 
                        jobId: jobId 
                    });
                }
            } 
            // Start a new job
            else {
                console.log("User:", user);
                
                // Find or create query model
                const query_models = await query_collection.find({ user: user.email }).toArray();
                
                let queryIndexId;
                if (query_models.length === 0) {
                    console.log("No query models found, creating a new model...");
                    queryIndexId = (await createModel(`MyModel_${user.email}`)).id;
                    await query_collection.insertOne({ user: user.email, indexId: queryIndexId });
                } else {
                    console.log("Query models found, using existing model...");
                    queryIndexId = query_models[0].indexId;
                }
                
                console.log("Upload video from URL:", videoUrl);
                const queryVideoId = await uploadVideoFromUrl(videoUrl, queryIndexId);
                const videoTitle = (await generateMetadata(queryVideoId)).title;
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
                
                // Start the sync process
                const syncJob = await startSyncVideo(videoUrl, finalText);
                
                // Save job details to database
                const jobDetails = {
                    ...syncJob,
                    videoUrl,
                    language,
                    summarize,
                    user: user.email,
                    queryIndexId,
                    queryVideoId,
                    videoTitle,
                    createdAt: new Date()
                };
                
                const result = await jobsCollection.insertOne(jobDetails);
                const jobId = result.insertedId.toString();
                
                await client.close();
                return res.status(202).json({ 
                    status: "PROCESSING", 
                    jobId: jobId 
                });
            }
        } catch (error) {
            console.error("Error:", error);
            await client.close();
            return res.status(500).json({ error: error.message });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}