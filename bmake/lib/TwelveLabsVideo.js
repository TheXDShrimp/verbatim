import "dotenv/config";
import { TwelveLabs } from "twelvelabs-js";
import { exec } from "child_process";
import { promisify } from "util";

const twelvelabs_api_key = process.env.TWELVELABS_API_KEY;
const client = new TwelveLabs({ apiKey: twelvelabs_api_key });
const execPromise = promisify(exec);

// -----------------------------> GENERATE A NEW MODEL (DO ONE FOR EVERY USER) <-----------------
export async function createModel(indexName) {
  const models = [
    {
      name: "marengo2.7",
      options: ["visual", "audio"],
    },
    {
      name: "pegasus1.2",
      options: ["visual", "audio"],
    },
  ];

  let index = await client.index.create({
    name: indexName,
    models: models,
    addons: ["thumbnail"],
  });
  console.log(
    `A new index has been created: id=${index.id}, name=${index.name}`
  );
  return index;
}

// -----------------------------> UPLOAD VIDEO WITH YOUTUBE URL (Force Youtube) <--------------------------

export async function downloadAndUploadYoutubeVideo(
  youtubeUrl,
  indexId,
  videoNumebr
) {
  try {
    const videoPath = "video" + videoNumebr + ".mp4";
    console.log("Downloading video...");
    await execPromise(`yt-dlp -f best -o ${videoPath} ${youtubeUrl}`);
    console.log("Download complete");

    return await uploadVideo(videoPath, indexId);
  } catch (error) {
    console.error("Error downloading video:", error);
  }
}
// -----------------------------> UPLOAD VIDEO WITH VIDEO URL <-----------------------------------
export async function uploadVideoFromUrl(videoUrl, indexId) {
  try {
    console.log("Uploading to Twelve Labs...");
    const task = await client.task.create({
      indexId: indexId,
      url: videoUrl,
    });
    console.log(`Task id=${task.id} Video id=${task.videoId}`);

    await task.waitForDone(500, (task) => {
      console.log(`Status=${task.status}`);
    });

    if (task.status !== "ready") {
      throw new Error(`Indexing failed with status ${task.status}`);
    }

    console.log(`The unique identifier of your video is ${task.videoId}`);
    return task.videoId;
  } catch (error) {
    console.error("Error during video upload:", error);
  }
}


// -----------------------------> UPLOAD VIDEO FROM LOCAL (local file) <--------------------------

export async function uploadVideo(videoPath, indexId) {
  try {
    console.log("Uploading to Twelve Labs...");
    const task = await client.task.create({
      indexId: indexId,
      file: videoPath,
    });
    console.log(`Task id=${task.id} Video id=${task.videoId}`);

    await task.waitForDone(500, (task) => {
      console.log(`Status=${task.status}`);
    });

    if (task.status !== "ready") {
      throw new Error(`Indexing failed with status ${task.status}`);
    }

    console.log(`The unique identifier of your video is ${task.videoId}`);
    return task.videoId;
  } catch (error) {
    console.error("Error during video upload:", error);
  }
}

// ------------> GENERATE A TITLE, AND RELATED DETAILS (USE TO TAG VIDEOS IN UI) <---------------
export async function generateMetadata(videoId) {
  const gist = await client.generate.gist(videoId, [
    "title",
    "topic",
    "hashtag",
  ]);
  console.log(
    `Title: ${gist.title}\nTopics=${gist.topics}\nHashtags=${gist.hashtags}`
  );
  return gist;
}

// --------------------> GENERATE CHAPTERS (DO THIS INITIALLY TO EXPLAIN VIDEO) <----------------
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export async function generateChapters(videoId) {
  const chapters = await client.generate.summarize(
    videoId,
    "chapter",
    "Generate chapters (max 10) while matching the teaching style of the video. Make sure to keep the titles relatively broad, while making the chapter summaries use simple but specific language"
  );

  for (const chapter of chapters.chapters) {
    console.log(
      `Chapter ${chapter.chapterNumber} - ${
        chapter.chapterTitle
      }\nTime: ${formatTime(chapter.start)} - ${formatTime(
        chapter.end
      )}\nSummary: ${chapter.chapterSummary}\n`
    );
  }

  return chapters.chapters.map((chapter) => ({
    chapterNumber: chapter.chapterNumber,
    chapterTitle: chapter.chapterTitle,
    start: formatTime(chapter.start),
    end: formatTime(chapter.end),
    summary: chapter.chapterSummary,
  }));
}

// --------------> QUESTIONS QUERY NOT STREAMING (formated output for questions) <---------------
export async function generateText(videoId, prompt) {
  const text = await client.generate.text(videoId, prompt);
  console.log(text.data);
  return text.data;
}

// --------------> SEARCH FOR TEXT QUERIES (find time stamps of intrest) <-----------------
export async function searchQuery(
  indexId,
  queryText,
  limitResults,
  desiredVideo
) {
  let searchResults = await client.search.query({
    indexId: indexId,
    queryText: queryText,
    options: ["visual", "audio"],
    operator: "and",
  });

  printPage(searchResults.data, limitResults, desiredVideo);

  while (true) {
    const page = await searchResults.next();
    if (page === null) break;
    else printPage(page, limitResults, desiredVideo);
  }

  return searchResults.data;
}

// Print search results
function printPage(searchData, limitResults, desiredVideo) {
  if (!Array.isArray(searchData)) {
    console.error("Expected searchData to be an array");
    return;
  }

  searchData.forEach((clip) => {
    if (limitResults && clip.videoId === desiredVideo) {
      console.log(
        `Video ID: ${clip.videoId}\n` +
          `Score: ${clip.score}\n` +
          `Start: ${clip.start}\n` +
          `End: ${clip.end}\n` +
          `Confidence: ${clip.confidence}\n`
      );
    } else if (!limitResults) {
      console.log(
        `Video ID: ${clip.videoId}\n` +
          `Score: ${clip.score}\n` +
          `Start: ${clip.start}\n` +
          `End: ${clip.end}\n` +
          `Confidence: ${clip.confidence}\n`
      );
    }
  });
}

// TESTERS:
// bmake as my working directory, to test do: node lib/TwelveLabsVideo.js

// createModel("HEHEH HA");

// downloadAndUploadYoutubeVideo(
//   "https://www.youtube.com/watch?v=FAyKDaXEAgc&ab_channel=DanielThrasher",
//   "67ba1e3a0cb7e370a801cd73",
//   "10"
// );

uploadVideoFromUrl('https://dl.dropboxusercontent.com/scl/fi/1uk1ne6xd2bvna7tcpaiy/Trump-Talking-Made-with-Clipchamp.mp4?rlkey=yswxavfajf4hhx9835yhtbwrl&st=9crhks0c&dl=0',
  '67ba890e0cb7e370a801dd13');

// generateMetadata("67ba2b5a589f15770cd95290");

// generateChapters("67ba1ef151e07a2910a9c51a");

// generateText("67ba2efd589f15770cd95291", "What is topology?");

// searchQuery(
//   "67ba1e3a0cb7e370a801cd73",
//   "Draymond Green",
//   true,
//   "67ba2b5a589f15770cd95290"
// );
