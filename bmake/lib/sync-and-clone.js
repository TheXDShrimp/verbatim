import { generateLipSync, checkSyncStatus } from "./sync.js";
import { createVoiceFromMP4, deleteVoice } from "./voiceclone.js";
const path = require("path");
const os = require("os");

// Initial function to start the sync process
export async function startSyncVideo(videoUrl, text) {
    const mp4Url = videoUrl;
    const outputMp3Path = path.join(os.tmpdir(), 'output.mp3');
    const name = 'Alex';
    
    try {
        // Create voice
        const voiceId = await createVoiceFromMP4(mp4Url, outputMp3Path, name);
        console.log('Voice creation response:', voiceId);
        
        // Start sync process and get the job ID
        const syncJob = await generateLipSync(mp4Url, text, voiceId);
        
        // Return job details for tracking
        return {
            status: 'PROCESSING',
            jobId: syncJob.id,
            voiceId: voiceId,
            videoUrl: mp4Url,
            text: text
        };
    } catch (error) {
        console.error('Error starting sync process:', error);
        throw error;
    }
}

// Function to check status and continue or complete the process
export async function checkSyncVideoStatus(jobDetails) {
    try {
        // Check current status
        const statusResult = await checkSyncStatus(jobDetails.jobId);
        
        if (statusResult.complete) {
            if (statusResult.status === 'COMPLETED') {
                // Process is complete, clean up
                await deleteVoice(jobDetails.voiceId);
                console.log('Voice deleted successfully');
                
                return {
                    status: 'COMPLETED',
                    outputUrl: statusResult.outputUrl
                };
            } else {
                // Handle error
                await deleteVoice(jobDetails.voiceId);
                console.log('Voice deleted after error');
                
                return {
                    status: 'ERROR',
                    error: statusResult.error
                };
            }
        } else {
            // Still processing
            return {
                status: 'PROCESSING',
                jobId: jobDetails.jobId,
                voiceId: jobDetails.voiceId,
                videoUrl: jobDetails.videoUrl,
                text: jobDetails.text
            };
        }
    } catch (error) {
        console.error('Error checking sync status:', error);
        
        // Try to clean up on error
        try {
            await deleteVoice(jobDetails.voiceId);
            console.log('Voice deleted after error');
        } catch (cleanupError) {
            console.error('Error deleting voice during cleanup:', cleanupError);
        }
        
        throw error;
    }
}