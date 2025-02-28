import 'dotenv/config';

const SYNC_API_KEY = process.env.SYNC_API_KEY;
console.log('SYNC_API_KEY:', SYNC_API_KEY);

export async function generateLipSync(inputUrl, text, voiceId) {
    const options = {
        method: 'POST',
        headers: {
            'x-api-key': SYNC_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "lipsync-1.9.0-beta",
            input: [
                {
                    type: "video",
                    url: inputUrl
                },
                {
                    type: "text",
                    provider: {
                        name: "elevenlabs",
                        voiceId: voiceId,
                        script: text
                    }
                }
            ],
            options: {
                pads: [0, 5, 0, 0],
                speedup: 1,
                output_format: "mp4",
                sync_mode: "bounce",
                fps: 25,
                output_resolution: [1280, 720],
                active_speaker: true
            }
        })
    };

    console.log('Request options:', options);

    try {
        const response = await fetch('https://api.sync.so/v2/generate', options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Server error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`);
        }
        const jsonResponse = await response.json();
        const id = jsonResponse.id;
        console.log('Response ID:', id);
        
        // Instead of waiting for the complete result, return the ID immediately
        return { 
            id: id,
            status: 'PENDING'
        };
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}

// This function now checks once and returns the current status
export async function checkSyncStatus(id) {
    const options = { 
        method: 'GET', 
        headers: { 'x-api-key': SYNC_API_KEY } 
    };

    try {
        const response = await fetch(`https://api.sync.so/v2/generate/${id}`, options);
        const jsonResponse = await response.json();
        
        if (jsonResponse.status && (jsonResponse.status === 'PENDING' || jsonResponse.status === 'PROCESSING')) {
            return { 
                status: jsonResponse.status,
                complete: false
            };
        } else if (jsonResponse.outputUrl) {
            console.log('Output URL:', jsonResponse.outputUrl);
            return {
                status: 'COMPLETED',
                complete: true,
                outputUrl: jsonResponse.outputUrl
            };
        } else {
            return {
                status: 'ERROR',
                complete: true,
                error: jsonResponse
            };
        }
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}