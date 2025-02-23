import { auth0 } from "@/lib/auth";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useState } from "react";
import { useRouter } from "next/router";

export async function getServerSideProps(context) {
  const session = await auth0.getSession(context.req, context.res);
  return {
    props: {
      user: session?.user || null,
    },
  };
}

const inter = Inter({ subsets: ["latin"] });

export default function Upload({ user }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState("English");
  const [summarize, setSummarize] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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

  return (
    <>
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-full">
        <nav className="flex flex-wrap items-center justify-between p-4 md:p-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-2xl md:text-[32px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600"
            >
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

      {/* Main Content */}
      <main className={`flex min-h-screen flex-col items-center justify-center p-6 md:p-24 ${inter.className}`}>
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl">
          {/* Video URL input */}
          <div className="w-full relative flex flex-col place-items-center">
            <div className="w-full items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">Upload a video</h1>
              {/* Video URL input with updated styling */}
              <input
                type="text"
                placeholder="Enter a video URL"
                className="w-full p-4 rounded-lg text-white bg-gray-800 border-2 border-gray-500 focus:outline-none focus:ring-0"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              {/* Language dropdown and Summarize toggle switch */}
              <div className="flex flex-col md:flex-row items-center w-full mt-4 space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative w-full md:w-1/2">
                  <select
                    className="w-full p-4 rounded-lg bg-black text-white bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-base md:text-lg"
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
                  {/* Dropdown icon with gradient */}
                  <span className="absolute right-4 top-4 text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600">
                    ▼
                  </span>
                </div>
                {/* Summarize toggle switch */}
                <div className="flex items-center justify-center w-full md:w-1/2">
                  <div className="flex items-center space-x-4">
                    <div className={`text-base md:text-lg font-bold w-32 text-center ${summarize ? 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600' : 'text-gray-200'}`}>
                      {summarize ? "Summarized" : "Original"}
                    </div>
                    {/* Toggle button with updated styling */}
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
              {/* Upload button */}
              <button
                className="bg-gradient-to-br from-yellow-400 to-orange-600 text-white font-bold px-8 py-4 rounded-xl mt-4 hover:from-yellow-500 hover:to-orange-700 transition-all duration-300"
                onClick={() => {
                  setLoading(true);
                  let updatedVideoUrl = videoUrl;
                  if (updatedVideoUrl.startsWith('https://www.dropbox.com')) {
                    updatedVideoUrl = updatedVideoUrl.replace('https://www.dropbox.com', 'https://dl.dropboxusercontent.com');
                  }
                  fetch('/api/go', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ videoUrl: updatedVideoUrl, language, summarize, user }),
                  }).finally(() => setLoading(false));
                }}
              >
                Upload
              </button>
              {loading && <p className="text-lg mt-4">Uploading video...</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
