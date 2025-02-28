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
        return await pollForOutputUrl(id);
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}

function pollForOutputUrl(id) {
    const options2 = { method: 'GET', headers: { 'x-api-key': SYNC_API_KEY } };

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`https://api.sync.so/v2/generate/${id}`, options2);
                const jsonResponse = await response.json();
                if (jsonResponse.status && (jsonResponse.status === 'PENDING' || jsonResponse.status === 'PROCESSING')) {
                    // console.log('Still processing, waiting...');
                } else {
                    console.log('Output URL:', jsonResponse.outputUrl);
                    clearInterval(interval);
                    resolve(jsonResponse.outputUrl);
                }
            } catch (err) {
                console.error('Fetch error:', err);
                clearInterval(interval);
                reject(err);
            }
        }, 5000); // Poll every 5 seconds
    });
}