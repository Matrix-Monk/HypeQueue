"use client";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/youtube"), {
  ssr: false,
});

type Props = {
  url: string;
};

const YouTubePlayer = ({ url }: Props) => {
  if (!url) return null; // Avoid rendering with empty URL

  return (
    <div className="aspect-w-16 aspect-h-9">
      <ReactPlayer url={url} playing controls width="100%" height="100%" />
    </div>
  );
};

export default YouTubePlayer;
