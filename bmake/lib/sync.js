const options = {
    method: 'POST',
    headers: {
        'x-api-key': 'sk-vqueb-NBTCm5kirwizqpbw.TShtC5IE_Y8fqLT20FQBJYWsczzuZpVN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: "lipsync-1.9.0-beta",
        input: [
            {
                type: "video",
                url: "https://synchlabs-public.s3.us-west-2.amazonaws.com/david_demo_shortvid-03a10044-7741-4cfc-816a-5bccd392d1ee.mp4"
            },
            {
                type: "text",
                provider: {
                    name: "elevenlabs",
                    voiceId: "CwhRBWXzGAHq8TQ4Fs17",
                    script: "There once was a ship that took to sea, the name of the ship was a large bunch of tea"
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

fetch('https://api.sync.so/v2/generate', options)
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(`Server error: ${response.status} ${response.statusText} - ${JSON.stringify(err)}`);
            });
        }
        return response.json();
    })
    .then(response => {
    //     console.log(response);
        const id = response.id;
        console.log('Response ID:', id);
        pollForOutputUrl(id);
    })
    .catch(err => console.error('Fetch error:', err));


function pollForOutputUrl(id) {
    const options2 = { method: 'GET', headers: { 'x-api-key': 'sk-vqueb-NBTCm5kirwizqpbw.TShtC5IE_Y8fqLT20FQBJYWsczzuZpVN' } };
    
    const interval = setInterval(() => {
        fetch(`https://api.sync.so/v2/generate/${id}`, options2)
            .then(response => response.json())
            .then(response => {
                if (response.status && (response.status === 'PENDING' || response.status === 'PROCESSING')) {
                    console.log('Still processing, waiting...');
                } else {
                    console.log('Output URL:', response.outputUrl);
                    clearInterval(interval);
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                clearInterval(interval);
            });
    }, 5000); // Poll every 5 seconds
}

