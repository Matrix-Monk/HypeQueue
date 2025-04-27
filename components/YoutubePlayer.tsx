"use client";

import { useEffect, useState } from "react";

type YouTubePlayerProps = {
  url: string;
  isHost: boolean;
};

const YouTubePlayer = ({ url, isHost }: YouTubePlayerProps) => {
  const [player, setPlayer] = useState<any>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Load YouTube Iframe API once
  useEffect(() => {
    if (typeof window !== "undefined" && !window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        console.log("YouTube API loaded.");
        setApiLoaded(true);
      };
    } else {
      setApiLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!apiLoaded || !url) return;

    const videoId = new URL(url).searchParams.get("v");
    if (!videoId) {
      console.error("Invalid YouTube URL.");
      return;
    }

    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);

        const ytPlayer = new window.YT.Player("youtube-player", {
          height: "390",
          width: "640",
          videoId,
          playerVars: {
            controls: isHost ? 1 : 0, // ONLY host gets controls
            disablekb: isHost ? 0 : 1, // Host can use keyboard shortcuts
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              console.log("Player ready.");
              setPlayer(event.target);
            },
          },
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [apiLoaded, url, isHost]);

  return (
    <div className="relative w-full h-0 pb-[56.25%]">
      <div
        id="youtube-player"
        className="absolute top-0 left-0 w-full h-full"
      />

      {/* Overlay to block interaction for non-host */}
      {!isHost && (
        <div
          className="absolute top-0 left-0 w-full h-full z-10"
          style={{ background: "transparent", pointerEvents: "auto" }}
        ></div>
      )}
    </div>
  );
};

export default YouTubePlayer;

