import { auth0 } from "@/lib/auth";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast, { Toaster } from 'react-hot-toast';

export async function getServerSideProps(context) {
  const session = await auth0.getSession(context.req, context.res);
  return {
    props: {
      user: session?.user || null,
    },
  };
}

async function pollJobStatus(jobId, user, maxAttempts = 500) {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`Checking job status, attempt ${attempt}...`);
    
    // Wait between polling attempts
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // Check job status
      const response = await fetch('/api/go', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, user }),
      });
      
      const data = await response.json();
      
      if (data.status === 'COMPLETED') {
        return { success: true, outputUrl: data.outputUrl };
      } else if (data.status === 'ERROR') {
        return { success: false, error: data.error };
      }
      // If still processing, continue the loop
    } catch (error) {
      console.error("Error checking job status:", error);
      // Continue polling despite errors
    }
  }
  
  // If we reach here, we've exceeded max attempts
  return { success: false, error: 'Timeout: Job processing took too long' };
}

const inter = Inter({ subsets: ["latin"] });

export default function Upload({ user }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState("English");
  const [summarize, setSummarize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const router = useRouter();  // Use the router hook for programmatic navigation

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen">
        <h1 className="text-4xl font-bold">You need to be logged in to access this page.</h1>
        <Link href="/auth/login" className="text-lg font-semibold hover:text-gray-300">
          Login
        </Link>
      </div>
    );
  }

  const handleUpload = async () => {
    setLoading(true);
    let updatedVideoUrl = videoUrl;
    if (updatedVideoUrl.startsWith('https://www.dropbox.com')) {
      updatedVideoUrl = updatedVideoUrl.replace('https://www.dropbox.com', 'https://dl.dropboxusercontent.com');
    }
  
    try {
      // Initial submission
      const response = await fetch('/api/go', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: updatedVideoUrl, language, summarize, user }),
      });
      
      const data = await response.json();
      
      if (data.status === 'PROCESSING' && data.jobId) {        
        // Option 2: Poll here and show progress
        setProcessing(true); // You'd need to add this state
        setProgress("Processing video..."); // You'd need to add this state
        
        const result = await pollJobStatus(data.jobId, user);
        setProcessing(false);
        
        if (result.success) {
          toast({
            title: "Processing completed",
            description: "Your video has been successfully processed.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          // Route to dashboard iff in upload right now
          if (router.pathname === '/upload') {
            router.push('/dashboard');
          }
        } else {
          toast({
            title: "Processing failed",
            description: result.error || "An unknown error occurred",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
        
      } else if (data.status === 'COMPLETED') {
        // Unlikely on first call, but handle it anyway
        toast({
          title: "Processing completed",
          description: "Your video has been successfully processed.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        if (router.pathname === '/upload') {
            router.push('/dashboard');
        }
      } else {
        // Handle error
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Error",
        description: "There was an error processing your video. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Upload</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full">
        <nav className="flex flex-wrap items-center justify-between p-4 md:p-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <img src="/favicon.ico" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            </Link>
            <Link href="/" className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 text-2xl font-bold">
              Verbatim
            </Link>
          </div>
          <div className="flex flex-wrap items-center space-x-4 md:space-x-8 mt-4 md:mt-0">
            <Link href="/dashboard" className="text-base md:text-lg font-semibold hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/upload" className="text-base md:text-lg font-semibold hover:text-gray-300">
              Upload
            </Link>
            <Link href="/auth/logout" className="text-base md:text-lg font-semibold hover:text-red-500">
              Logout
            </Link>
          </div>
        </nav>
      </div>
  
      <main className={`flex min-h-screen flex-col items-center justify-between p-6 md:p-24 ${inter.className}`}>
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mt-20">
          {/* Video URL input */}
          <div className="w-full relative flex flex-col place-items-center">
            <div className="w-full items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-center">Upload a video</h1>
  
              {/* Conditional Horizontal GIF container with reserved space */}
              <div className="w-full h-48 flex justify-center mb-6">
                {loading && <img src="/loading.gif" alt="GIF" className="h-48 w-[500px]" />}
              </div>
  
              {/* Video URL input with updated styling */}
              <input
                type="text"
                placeholder="Enter a video URL"
                className="w-full p-4 rounded-lg text-white bg-black border-2 border-gray-500 focus:outline-none focus:ring-0 mt-4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
  
              {/* Language dropdown and Summarize toggle switch */}
              <div className="flex flex-col md:flex-row items-center w-full mt-6 space-y-4 md:space-y-0 md:space-x-4">
                {/* Language dropdown */}
                <div className="relative w-full md:w-[60%]">
                  <select
                    className="w-full p-4 pr-8 rounded-lg bg-black text-white border-2 border-gray-500 focus:outline-none font-bold text-base md:text-lg appearance-none"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="english">Please Select a Language</option>
                    <option value="arabic">Arabic</option>
                    <option value="bulgarian">Bulgarian</option>
                    <option value="chinese">Chinese</option>
                    <option value="croatian">Croatian</option>
                    <option value="czech">Czech</option>
                    <option value="danish">Danish</option>
                    <option value="dutch">Dutch</option>
                    <option value="english">English</option>
                    <option value="finnish">Finnish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="greek">Greek</option>
                    <option value="hindi">Hindi</option>
                    <option value="indonesian">Indonesian</option>
                    <option value="italian">Italian</option>
                    <option value="japanese">Japanese</option>
                    <option value="korean">Korean</option>
                    <option value="malay">Malay</option>
                    <option value="polish">Polish</option>
                    <option value="portuguese">Portuguese</option>
                    <option value="romanian">Romanian</option>
                    <option value="russian">Russian</option>
                    <option value="slovak">Slovak</option>
                    <option value="spanish">Spanish</option>
                    <option value="swedish">Swedish</option>
                    <option value="turkish">Turkish</option>
                    <option value="ukrainian">Ukrainian</option>
                  </select>
                  {/* Dropdown icon ensuring visibility */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white">
                    ▼
                  </div>
                </div>
  
                {/* Summarize toggle with black background */}
                <div className="flex items-center justify-center w-full md:w-1/2">
                  <div className="w-full p-4 rounded-lg bg-black border-2 border-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className={`text-base md:text-lg font-bold w-32 text-center ${summarize ? 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600' : 'text-white'}`}>
                        {summarize ? "Summarized" : "Original"}
                      </div>
                      <div className="relative w-16 h-8">
                        <input
                          type="checkbox"
                          id="summarize"
                          name="summarize"
                          checked={summarize}
                          onChange={(e) => setSummarize(e.target.checked)}
                          className="sr-only"
                        />
                        <label
                          htmlFor="summarize"
                          className="block w-full h-full bg-black border-2 rounded-full cursor-pointer transition-all duration-300"
                          style={{
                            borderColor: summarize ? 'orange' : 'white',
                            background: 'linear-gradient(to bottom right, black, #1a1a1a)'
                          }}
                        >
                          <span
                            className={`block w-6 h-6 rounded-full absolute top-1 left-1 transition-all duration-300 transform ${
                              summarize ? 'translate-x-8 bg-gradient-to-br from-yellow-400 to-orange-600' : 'bg-white'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Upload button centered and made larger */}
            <div className="flex flex-col items-center justify-center w-full mt-6">
              <button
                className="bg-gradient-to-br from-yellow-400 to-orange-600 text-white font-bold px-8 py-4 rounded-xl hover:from-yellow-500 hover:to-orange-700 transition-all duration-300 text-2xl"
                onClick={handleUpload}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}