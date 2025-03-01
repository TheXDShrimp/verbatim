import { auth0 } from "@/lib/auth";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import Head from "next/head";
import { FaTrash } from "react-icons/fa";

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

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const deleteVideo = async (videoId, queryVideoId) => {
    try {
      const res = await fetch('/api/delete-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, user, queryVideoId }),
      });

      if (res.ok) {
        setVideos(videos.filter(video => video._id !== videoId));
      } else {
        console.error('Failed to delete video');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-screen">
        <nav className="flex items-center justify-between p-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <img src="/favicon.ico" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            </Link>
            <Link href="/" className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 text-2xl font-bold">
              Verbatim
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/upload" className="text-lg font-semibold hover:text-gray-300">
              Upload
            </Link>
            <Link href="/auth/logout" className="text-lg font-semibold hover:text-red-500">
              Logout
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className={`flex h-screen flex-col items-center justify-between p-24 ${inter.className}`}>
        {/* Container in the middle vertically + horizontally */}
        <div className="flex flex-col items-center mt-8 space-y-8 h-screen w-screen">
          {/* Video Info Boxes */}
          <div className="w-2/3 relative flex place-items-center">
            <div className="w-full items-center">
              <h1 className="text-6xl font-bold text-center mb-8">Your Videos</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div
                    key={video._id}
                    className="relative flex flex-col items-center justify-center bg-opacity-90
                              hover:bg-gray-600 transition-all duration-300 
                              p-4 rounded-lg shadow-md text-center border-2 border-gray-500
                              hover:border-transparent group"
                  >
                    <Link
                      href={`/video?videoId=${video._id}`}
                      className="w-full"
                    >
                      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-yellow-400 to-orange-600">
                        {video.videoTitle}
                      </h2>
                      <p className="text-lg text-gray-200">{video.summarize ? "Summarized" : "Not Summarized"}</p>
                      <p className="text-lg text-gray-200">{capitalizeFirstLetter(video.language)}</p>
                    </Link>
                    <button
                      onClick={() => deleteVideo(video._id, video.queryVideoId)}
                      className="absolute bottom-4 left-4 p-2 bg-gray-600 text-white rounded-full opacity-50 group-hover:opacity-100 group-hover:bg-red-600 transition-all duration-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}