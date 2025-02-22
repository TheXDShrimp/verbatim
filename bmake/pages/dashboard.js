import { auth0 } from "@/lib/auth";
import Link from "next/link";
import {Inter} from "next/font/google";
import { useState, useEffect } from "react";

export async function getServerSideProps(context) {
  const session = await auth0.getSession(context.req, context.res);

  return {
    props: {
      user: session?.user || null,
    },
  };
}

const inter = Inter({ subsets: ["latin"] });

export default function Dashboard({ user }) {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchVideos = async () => {
            const res = await fetch("/api/database", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user }),
            });

            const data = await res.json();
            setVideos(data);
        };

        fetchVideos();
    }, []);

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
          <h1 className="text-2xl font-bold">Speakerize</h1>
        </div>
        <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-300">Dashboard</Link>
            <Link href="/upload" className="text-lg font-semibold hover:text-gray-300">Upload</Link>
            <Link href="/auth/logout" className="text-lg font-semibold hover:text-gray-300">Logout</Link>
        </div>
      </nav>
      </div>
        {/* main content */}
        <main
          className={`flex h-screen flex-col items-center justify-between p-24 ${inter.className}`}
        >
          {/* container in the middle vertically + horizontally */}
          <div className="flex flex-col items-center mt-8 space-y-8 h-screen w-screen">
            {/* boxes with video info */}
            <div className="w-2/3 relative flex place-items-center">
              {/* two columns, one 2/3 and one 1/3 */}
              <div className="w-full items-center">
                  <h1 className="text-6xl font-bold text-center mb-8">
                    Your videos
                  </h1>
                  <div className="grid grid-cols-3 gap-4">
                      {videos.map((video) => (
                          <Link key={video._id} className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md text-gray-500" href={`/video?q=${video._id}`}>
                              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600">{video.videoUrl}</h2>
                              <p className="text-lg">{video.summarize ? "Summarized" : "Not summarized"}</p>
                              <p className="text-lg">{video.language}</p>
                          </Link>
                      ))}
                  </div>
              </div>
              </div>
          </div>
        </main>
        </>
  );
}