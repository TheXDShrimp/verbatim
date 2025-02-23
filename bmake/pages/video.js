import { useState, useEffect, use } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function VideoPage() {
  const router = useRouter();
  const { videoId } = router.query;
  const [videoUrl, setVideoUrl] = useState("");
  const [messages, setMessages] = useState([["bot", "Welcome to the chat!"]]);
  const [newMessage, setNewMessage] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    const fetchVideo = async () => {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });
    
      const data = await res.json();
      setVideoUrl(data.videoUrl);
      setOutput(data.output);
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, ["user", newMessage]]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-screen w-screen">
      {/* navbar */}
      <div className="absolute top-0 left-0 w-3/4">
        <nav className="flex items-center justify-between p-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold">Verbatim</Link>
          </div>
          <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-300">Dashboard</Link>
              <Link href="/upload" className="text-lg font-semibold hover:text-gray-300">Upload</Link>
              <Link href="/auth/logout" className="text-lg font-semibold hover:text-gray-300">Logout</Link>
          </div>
        </nav>
      </div>

      {/* Video Container */}
      <div className="flex flex-1 items-center justify-center w-full px-12">
        {output ? (
        //   <video className="w-3/4 h-auto" controls>
        //     <source src={videoUrl} type="video/mp4" />
        //     Your browser does not support the video tag.
        //   </video>
          <iframe src={output} title="video" className="w-full h-full"/>
        ) : (
          <p className="text-2xl">No video URL provided</p>
        )}
      </div>

      {/* Chatbox */}
      <div className="w-1/4 bg-gray-900 text-white flex flex-col p-4 border-l border-gray-700">
        <h2 className="text-xl font-bold mb-4">Live Chat</h2>
        <div className="flex-1 overflow-y-auto border border-gray-700 p-2 rounded-lg">
          {messages.map((msg, index) => {
            if (msg[0] === "user") {
              return <div key={index} className="bg-gray-800 p-2 rounded-lg mb-2 w-3/4 ml-auto">
                {msg[1]}
              </div>
            } else {
              return <div key={index} className="bg-gray-700 p-2 rounded-lg mb-2 w-3/4">
                {msg[1]}
              </div>
            }
          })}
        </div>
        <div className="mt-4 flex">
          <input
            type="text"
            className="flex-1 p-2 text-black rounded-l-lg"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <button
            className="bg-gradient-to-br from-yellow-400 to-orange-600 px-4 py-2 rounded-r-lg"
            // submits the message
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}