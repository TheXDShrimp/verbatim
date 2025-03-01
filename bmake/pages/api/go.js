import { MongoClient, ObjectId } from "mongodb";
import { translateText } from "../../lib/translate.js";
import { summarizeText } from "../../lib/summarize.js";
import { startSyncVideo, checkSyncVideoStatus } from "@/lib/sync-and-clone";
import { startVideoUpload, checkVideoUploadStatus, generateMetadata, generateText, createModel } from "@/lib/TwelveLabsVideo";
import { transcribeAudio } from "@//lib/OpenAISpeechToText";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db("speakerize");
  const collection = db.collection("videos");
  const jobsCollection = db.collection("processing_jobs");
  const query_collection = db.collection("query_models");

  try {
    const { videoUrl, language, summarize, user, jobId, action } = req.body;

    // If jobId is provided, check status of existing job
    if (jobId) {
      const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
      
      if (!job) {
        await client.close();
        return res.status(404).json({ error: "Job not found" });
      }

      // Determine what to check based on current job stage
      switch (job.currentStage) {
        case "UPLOAD":
          // Check TwelveLabs upload status
          const uploadStatus = await checkVideoUploadStatus(job.taskId);
          
          if (uploadStatus.status === "completed") {
            // Update job with video ID and move to next stage
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              { 
                $set: { 
                  videoId: uploadStatus.videoId,
                  currentStage: "TRANSCRIBE",
                  lastUpdated: new Date()
                }
              }
            );
            
            await client.close();
            return res.status(202).json({ 
              status: "PROCESSING",
              currentStage: "TRANSCRIBE", 
              progress: "Video uploaded, starting transcription...",
              jobId 
            });
          } else if (uploadStatus.status === "failed") {
            await jobsCollection.deleteOne({ _id: new ObjectId(jobId) });
            await client.close();
            return res.status(500).json({ error: "Video upload failed" });
          } else {
            // Still uploading
            await client.close();
            return res.status(202).json({ 
              status: "PROCESSING", 
              currentStage: "UPLOAD",
              progress: "Creating Q&A model...",
              jobId 
            });
          }
          
        case "TRANSCRIBE":
          // Start transcription
          try {
            const text = await transcribeAudio(job.videoUrl);
            console.log("Transcribed text:", text);
            
            // Translate to English if needed
            const englishText = await translateText(text, "english");
            console.log("Translated text:", englishText);
            
            // Summarize if requested
            const summarizedText = job.summarize ? await summarizeText(englishText) : englishText;
            console.log("Summarized text:", summarizedText);
            
            // Translate to target language
            const finalText = await translateText(summarizedText, job.language);
            console.log("Final text:", finalText);
            
            // Get video metadata
            const videoTitle = (await generateMetadata(job.videoId)).title;
            
            // Update job and move to next stage
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              { 
                $set: { 
                  text: finalText,
                  videoTitle,
                  currentStage: "SYNC",
                  lastUpdated: new Date()
                }
              }
            );
            
            await client.close();
            return res.status(202).json({ 
              status: "PROCESSING",
              currentStage: "SYNC", 
              progress: "Transcription complete, starting lip sync...",
              jobId 
            });
          } catch (error) {
            console.error("Transcription error:", error);
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              { $set: { error: error.message } }
            );
            await client.close();
            return res.status(500).json({ error: "Transcription failed" });
          }
          
        case "SYNC":
          // Start sync if not started yet
          if (!job.syncJobId) {
            try {
              const syncJob = await startSyncVideo(job.videoUrl, job.text);
              
              await jobsCollection.updateOne(
                { _id: new ObjectId(jobId) },
                { 
                  $set: { 
                    syncJobId: syncJob.jobId,
                    voiceId: syncJob.voiceId,
                    lastUpdated: new Date()
                  }
                }
              );
              
              await client.close();
              return res.status(202).json({ 
                status: "PROCESSING",
                currentStage: "SYNC", 
                progress: "Lip sync started...",
                jobId 
              });
            } catch (error) {
              console.error("Sync start error:", error);
              await jobsCollection.updateOne(
                { _id: new ObjectId(jobId) },
                { $set: { error: error.message } }
              );
              await client.close();
              return res.status(500).json({ error: "Sync process failed to start" });
            }
          } 
          // Check sync status if already started
          else {
            try {
              const statusResult = await checkSyncVideoStatus({
                jobId: job.syncJobId,
                voiceId: job.voiceId,
                videoUrl: job.videoUrl,
                text: job.text
              });
              
              if (statusResult.status === 'COMPLETED') {
                // Job is complete, update the main videos collection
                await collection.insertOne({
                  videoUrl: job.videoUrl,
                  language: job.language,
                  summarize: job.summarize,
                  user: job.user,
                  output: statusResult.outputUrl,
                  queryIndexId: job.queryIndexId,
                  queryVideoId: job.videoId,
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
                // Still processing
                await client.close();
                return res.status(202).json({ 
                  status: "PROCESSING", 
                  currentStage: "SYNC",
                  progress: "Creating lip-synced video...",
                  jobId 
                });
              }
            } catch (error) {
              console.error("Sync status check error:", error);
              await client.close();
              return res.status(500).json({ error: "Failed to check sync status" });
            }
          }
          
        default:
          await client.close();
          return res.status(400).json({ error: "Unknown job stage" });
      }
    } 
    // Start a new job
    else {
      console.log("Starting new job for user:", user);
      let updatedVideoUrl = videoUrl;
      if (updatedVideoUrl.startsWith('https://www.dropbox.com')) {
        updatedVideoUrl = updatedVideoUrl.replace('https://www.dropbox.com', 'https://dl.dropboxusercontent.com');
      }
      
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
      
      // Start video upload
      console.log("Starting video upload from URL:", updatedVideoUrl);
      const uploadTask = await startVideoUpload(updatedVideoUrl, queryIndexId);
      
      // Create new job
      const newJob = {
        videoUrl: updatedVideoUrl,
        language,
        summarize,
        user: user.email,
        queryIndexId,
        taskId: uploadTask.taskId,
        currentStage: "UPLOAD",
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      // Save to database
      const result = await jobsCollection.insertOne(newJob);
      const jobId = result.insertedId.toString();
      
      await client.close();
      return res.status(202).json({ 
        status: "PROCESSING", 
        currentStage: "UPLOAD",
        progress: "Starting video upload...",
        jobId 
      });
    }
  } catch (error) {
    console.error("Error:", error);
    await client.close();
    return res.status(500).json({ error: error.message });
  }
}