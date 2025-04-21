"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Music, Clock, ListPlus, History, Trash2 } from "lucide-react";
import YouTubePlayer from "./YoutubePlayer";
import axios from "axios";

type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  type: string;
  extractedId: string;
  duration: number;
  thumbnail: string;
  roomId: string;
  createdAt: string;
  voteCount: number;
  isVoted: boolean;
};

interface GetSongResponse {
  message: string;
  songs: Song[];
}

export default function RoomPageContent({
  roomId,
  name,
  hostId,
}: {
  roomId: string;
  name: string;
  hostId: string;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [room, setRoom] = useState<any>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [upcomingSongs, setUpcomingSongs] = useState<Song[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const fetchSongs = async () => {
    try {
      console.log("fetch song called");

      console.log(roomId);

      const res = await axios.get(`/api/room/song`, {
        params: {
          roomId,
          ...(userId === hostId ? { hostId } : { userId }),
        },
      });

      if (res.status !== 200) {
        console.log("Error while fetching the song");
      }
      console.log("fetched songs" + JSON.stringify(res));

      const data = res.data as GetSongResponse;

      const songs = data.songs as Song[];

      if (!songs || songs.length === 0) {
        setCurrentSong(null);
        setUpcomingSongs([]);
        return;
      }

      const current = currentSong ?? songs[0];

      const rest = songs.filter((song) => song.id !== current.id);

      const sortedUpcoming = [...rest].sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      setCurrentSong(current);
      setUpcomingSongs(sortedUpcoming);
    } catch (err) {
      console.error("Error fetching songs", err);
    }
  };

  useEffect(() => {
    setRoom({
      id: roomId,
      name,
      hostId,
    });

    if (roomId) {
      fetchSongs();
    }
  }, [roomId]);

  const isHost = userId === room?.hostId;

  const handleAddToQueue = async () => {
    if (!youtubeUrl) return;

    const response = await axios.post("/api/room/song", {
      roomId,
      url: youtubeUrl,
      type: "youtube",
    });

    if (response.status !== 200) {
      console.log("Error while adding a song");
    }

    console.log("song added successfully");

    setYoutubeUrl("");
    fetchSongs();
  };

  const handleVote = async (songId: string, isVoted: boolean) => {
    try {
      const payload =
        userId === hostId ? { hostId, songId } : { userId, songId };
      
      console.log("Sending DELETE vote with payload:", payload); 

      if (isVoted) {
        // User already voted → delete vote
        const response = await axios.request({
          url: "/api/room/song/vote",
          method: "DELETE",
          params: payload,
        });
        if (response.status === 200) {
          console.log("Vote removed");
        }
      } else {
        // User hasn’t voted → create vote
        const response = await axios.post("/api/room/song/vote", payload);
        if (response.status === 201) {
          console.log("Vote created");
        }
      }

      // Refetch updated song list
      await fetchSongs();
    } catch (err) {
      console.error("Error while voting", err);
    }
  };

  return (
    <main className="min-h-screen relative text-white">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/img2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4)",
        }}
      />

      <Navbar type="logout" />

      <div className="relative z-10 px-6 py-10 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-white">
              Room: {room?.name}
            </h1>
            <p className="text-zinc-300 mt-1">Host: {room?.hostId}</p>
          </div>
          {isHost && (
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash2 size={18} />
              End Room
            </Button>
          )}
        </motion.div>

        {/* Responsive Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Current Song + Input - Top on mobile, right on desktop */}
          <div className="w-full md:w-1/3 space-y-6 order-1 md:order-2">
            {/* Current Song */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 flex flex-col gap-4">
              <YouTubePlayer url={currentSong?.url || ""} />
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">
                    {currentSong?.title}
                  </h2>
                  <p className="text-zinc-400">{currentSong?.artist}</p>
                  <div className="text-sm text-zinc-400 flex items-center gap-2">
                    <Clock size={16} />
                    {Math.floor((currentSong?.duration || 0) / 60)}:
                    {(currentSong?.duration || 0) % 60}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Song URL Input */}
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3">
              <label htmlFor="youtube-url" className="text-sm text-zinc-300">
                Paste YouTube URL
              </label>
              <input
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-md bg-zinc-900 text-white border border-white/10 placeholder:text-zinc-500 focus:outline-none"
              />
              <Button onClick={handleAddToQueue} className="w-full mt-2">
                Add to Queue
              </Button>
            </div>
          </div>

          {/* Upcoming Songs - Bottom on mobile, left on desktop */}
          <div className="w-full md:w-2/3 space-y-4 order-2 md:order-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Upcoming Songs
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {upcomingSongs.map((song) => (
                <div
                  key={song.id}
                  className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md flex gap-4 items-center justify-between hover:scale-[1.01] transition"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium text-white">{song.title}</p>
                      <p className="text-sm text-zinc-400">{song.artist}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-zinc-300 mb-1">
                      Votes: {song.voteCount}
                    </p>
                    <Button
                      onClick={() => handleVote(song.id, song.isVoted)}
                      size="sm"
                      variant={song.isVoted ? "destructive" : "secondary"}
                    >
                      {song.isVoted ? "Unvote" : "Vote"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
