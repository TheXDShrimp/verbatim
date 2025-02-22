import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function VideoPage() {
  const router = useRouter();
//   const { videoUrl } = router.query;
  const [videoUrl, setVideoUrl] = useState("https://synchlabs-public.s3.us-west-2.amazonaws.com/david_demo_shortvid-03a10044-7741-4cfc-816a-5bccd392d1ee.mp4");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prevMessages) => [...prevMessages, "New chat message!"]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, newMessage]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-screen w-screen">

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
      {/* Video Container */}
      <div className="flex flex-1 items-center justify-center">
        {videoUrl ? (
        //   <video className="w-3/4 h-auto" controls>
        //     <source src={videoUrl} type="video/mp4" />
        //     Your browser does not support the video tag.
        //   </video>
          <iframe src={"https://synchlabs-public.s3.us-west-2.amazonaws.com/david_demo_shortvid-03a10044-7741-4cfc-816a-5bccd392d1ee.mp4"} title="video" />
        ) : (
          <p className="text-2xl">No video URL provided</p>
        )}
      </div>

      {/* Chatbox */}
      <div className="w-1/4 bg-gray-900 text-white flex flex-col p-4 border-l border-gray-700">
        <h2 className="text-xl font-bold mb-4">Live Chat</h2>
        <div className="flex-1 overflow-y-auto border border-gray-700 p-2 rounded-lg">
          {messages.map((msg, index) => (
            <p key={index} className="mb-2 bg-gray-800 p-2 rounded-lg">{msg}</p>
          ))}
        </div>
        <div className="mt-4 flex">
          <input
            type="text"
            className="flex-1 p-2 text-black rounded-l-lg"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            className="bg-gradient-to-br from-yellow-400 to-orange-600 px-4 py-2 rounded-r-lg"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}