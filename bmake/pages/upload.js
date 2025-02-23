import { auth0 } from "@/lib/auth";
import Link from "next/link";
import {Inter} from "next/font/google";
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
                <Link href="/auth/login" className="text-lg font-semibold hover:text-gray-300">Login</Link>
            </div>
        );
    }
    return (<>
      {/* navbar */}
      <div className="absolute top-0 left-0 w-screen">
      <nav className="flex items-center justify-between p-8">
        <div className="flex items-center space-x-4">
        <Link href="/" className="text-[32px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600">Verbatim</Link>
        </div>
        <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-300">Dashboard</Link>
            <Link href="/upload" className="text-lg font-semibold hover:text-gray-300">Upload</Link>
            <Link href="/auth/logout" className="text-lg font-semibold hover:text-red-500">Logout</Link>
        </div>
      </nav>
      </div>
        {/* main content */}
        <main
          className={`flex h-screen flex-col items-center justify-between p-24 ${inter.className}`}
        >
          {/* container in the middle vertically + horizontally */}
          <div className="flex flex-col items-center justify-center space-y-8 h-screen w-screen">
            {/* Video URL input */}
            <div className="w-2/3 relative flex place-items-center">
              {/* two columns, one 2/3 and one 1/3 */}
              <div className="w-full items-center justify-center">
                  <h1 className="text-6xl font-bold text-center mb-4">
                    Upload a video
                  </h1>
                  <input
                    type="text"
                    placeholder="Enter a video URL"
                    className="w-full p-4 mt-4 rounded-lg text-gray-500"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  
                    {/* language dropdown */}
                    <select
                      className="w-full p-4 mt-4 rounded-lg text-gray-500"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
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
                        <option value="tamil">Tamil</option>
                        <option value="turkish">Turkish</option>
                        <option value="ukrainian">Ukrainian</option>
                    </select>
                    {/* checkbox */}
                    <div className="flex items-center mt-4">
                        <input type="checkbox" id="summarize" name="summarize"
                        checked={summarize}
                        onChange={(e) => setSummarize(e.target.checked)}
                        />
                        <label htmlFor="summarize" className="ml-2">Summarize</label>
                    </div>
                    {/* upload button */}
                  <button className="bg-gradient-to-br from-yellow-400 to-orange-600 text-white font-bold px-6 py-3 rounded-xl mt-4"
                    onClick={() => {
                      setLoading(true);
                      let updatedVideoUrl = videoUrl;
                      if (updatedVideoUrl.startsWith('https://www.dropbox.com')) {
                        updatedVideoUrl = updatedVideoUrl.replace('https://www.dropbox.com', 'https://dl.dropboxusercontent.com');
                      }
                      fetch('/api/go', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ videoUrl: updatedVideoUrl, language, summarize, user })
                      }).finally(() => {
                        setLoading(false);
                        router.push({ pathname: '/dashboard'});
                      });
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
