import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function VideoPage() {
  const router = useRouter();
  const { videoId } = router.query;
  const [videoUrl, setVideoUrl] = useState("");
  const [messages, setMessages] = useState([["bot", "Welcome to the chat!"]]);
  const [newMessage, setNewMessage] = useState("");
  const [output, setOutput] = useState("");
  const [isOriginal, setIsOriginal] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTimestamp, setIsTimestamp] = useState(false);
  const [queryIndexId, setQueryIndexId] = useState("");
  const [queryVideoId, setQueryVideoId] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    setIsChatOpen(isOriginal);
  }, [isOriginal]);

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
      setQueryIndexId(data.queryIndexId);
      setQueryVideoId(data.queryVideoId);
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const formatTime = (timeInSeconds) => {
    const roundedTime = Math.round(timeInSeconds);
    const minutes = Math.floor(roundedTime / 60);
    const seconds = roundedTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleGenerateText = async (prompt) => {
    const res = await fetch("/api/querygen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ queryVideoId, prompt }),
    });

    const data = await res.json();
    setMessages((prevMessages) => [...prevMessages, ["bot", data.text]]);
  };

  const handleTimestampQuery = async (prompt) => {
    // Prepend "talking about " if not already present
    const modifiedPrompt = prompt.includes("talking about") ? prompt : `talking about ${prompt}`;

    const res = await fetch("/api/timestamp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ queryIndexId, prompt: modifiedPrompt, queryVideoId }),
    });

    const data = await res.json();
    const formattedStart = formatTime(data.start);
    const formattedEnd = formatTime(data.end);
    setMessages((prevMessages) => [
      ...prevMessages,
      ["bot", <span onClick={() => seekToTime(data.start)} className="cursor-pointer text-blue-500">{`${formattedStart} - ${formattedEnd}`}</span>],
    ]);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages((prevMessages) => [...prevMessages, ["user", newMessage]]);
      if (!isTimestamp) {
        handleGenerateText(newMessage);
      } else {
        handleTimestampQuery(newMessage);
      }
      setNewMessage("");
    }
  };

  const seekToTime = (timeInSeconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      videoRef.current.play();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Navbar */}
      <div className="w-full z-10">
        <nav className="flex items-center justify-between p-4 shadow-md">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 text-2xl font-bold">
              Verbatim
            </Link>
          </div>

          {/* Right-side elements container */}
          <div
            className={`flex items-center space-x-2 md:space-x-8 transition-all duration-300 ease-in-out ${
              isChatOpen ? 'mr-0' : 'mr-1/4'
            }`}
          >
            {/* Toggle Switch */}
            <div
              className="relative flex items-center w-48 md:w-64 h-10 md:h-14 border-2 border-yellow-400 rounded-full cursor-pointer"
              onClick={() => setIsOriginal(!isOriginal)}
            >
              {/* Background for the switch */}
              <div className="w-full h-full flex rounded-full transition-all duration-300">
                {/* Toggle pill */}
                <div
                  className={`w-[calc(50%-8px)] h-[calc(100%-8px)] bg-yellow-400 rounded-full absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out ${
                    isOriginal ? 'left-[4px]' : 'left-[calc(50%+4px)]'
                  }`}
                />
              </div>

              {/* Text for Original and Converted */}
              <div className="absolute w-full h-full flex items-center justify-between px-1">
                <span
                  className={`w-[calc(50%-8px)] flex items-center justify-center font-semibold ${
                    isOriginal ? 'text-black' : 'text-yellow-400'
                  } transition-all duration-300`}
                >
                  Original
                </span>
                <span
                  className={`w-[calc(50%-8px)] flex items-center justify-center font-semibold ${
                    isOriginal ? 'text-yellow-400' : 'text-black'
                  } transition-all duration-300`}
                >
                  Converted
                </span>
              </div>
            </div>

            <Link href="/dashboard" className="text-sm md:text-lg font-semibold hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/upload" className="text-sm md:text-lg font-semibold hover:text-gray-300">
              Upload
            </Link>
            <Link href="/auth/logout" className="text-sm md:text-lg font-semibold hover:text-gray-300">
              Logout
            </Link>
          </div>
        </nav>
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-1 overflow-hidden mt-4">
        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          {isOriginal ? (
            videoUrl ? (
              <video ref={videoRef} src={videoUrl} controls className="w-full h-full max-w-4xl max-h-[70vh]" />
            ) : (
              <p className="text-xl md:text-2xl">No original video URL provided</p>
            )
          ) : (
            output ? (
              <video ref={videoRef} src={output} controls className="w-full h-full max-w-4xl max-h-[70vh]" />
            ) : (
              <p className="text-xl md:text-2xl">No converted video URL provided</p>
            )
          )}
        </div>

        {/* Chatbox */}
        <div
          className={`w-1/4 bg-gray-900 text-white flex flex-col border-l border-gray-700 transition-all duration-300 ease-in-out ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold">Live Chat</h2>
            <div
              className="relative flex items-center w-48 md:w-64 h-10 md:h-14 border-2 border-yellow-400 rounded-full cursor-pointer"
              onClick={() => setIsTimestamp(!isTimestamp)}
            >
              <div className="w-full h-full flex rounded-full transition-all duration-300">
                <div
                  className={`w-[calc(50%-8px)] h-[calc(100%-8px)] bg-yellow-400 rounded-full absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out ${
                    isTimestamp ? 'left-[4px]' : 'left-[calc(50%+4px)]'
                  }`}
                />
              </div>
              <div className="absolute w-full h-full flex items-center justify-between px-1">
                <span
                  className={`w-[calc(50%-8px)] flex items-center justify-center font-semibold ${
                    isTimestamp ? 'text-black' : 'text-yellow-400'
                  } transition-all duration-300`}
                >
                  Timestamp
                </span>
                <span
                  className={`w-[calc(50%-8px)] flex items-center justify-center font-semibold ${
                    isTimestamp ? 'text-yellow-400' : 'text-black'
                  } transition-all duration-300`}
                >
                  Query
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto border-t border-gray-700 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg mb-2 w-3/4 ${
                  msg[0] === 'user' ? 'bg-gray-800 ml-auto text-right' : 'bg-gray-700'
                }`}
              >
                {msg[1]}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex">
              <input
                type="text"
                className="flex-1 p-2 text-black rounded-l-lg"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
      </div>
    </div>
  );
}