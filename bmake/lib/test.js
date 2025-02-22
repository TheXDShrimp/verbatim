import { generateLipSync } from "./sync.js";

generateLipSync('https://synchlabs-public.s3.us-west-2.amazonaws.com/david_demo_shortvid-03a10044-7741-4cfc-816a-5bccd392d1ee.mp4', 'There once was a ship that took to sea, the name of the ship was a large bunch of tea')
    .then(outputUrl => {
        console.log('Final Output URL:', outputUrl);
    })
    .catch(err => {
        console.error('Error:', err);
    });