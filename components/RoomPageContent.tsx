"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Clock, Trash2 } from "lucide-react";
import Image from "next/image";
import YouTubePlayer from "./YoutubePlayer";
import axios from "axios";
import { toast } from "sonner";
import RoomNavbar from "./RoomNavbar";
import { Song } from "@/lib/validation";

type Room = {
  id: string;
  name: string;
  hostId: string;
};

interface GetSongResponse {
  message: string;
  songs: Song[];
}

type UserEvent = {
  userName: string;
  action: "joined" | "left";
  timestamp: number;
};

export default function RoomPageContent({
  roomId,
  name,
  hostId,
}: {
  roomId: string;
  name: string;
  hostId: string;
}) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [upcomingSongs, setUpcomingSongs] = useState<Song[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [usersInRoom, setUsersInRoom] = useState<string[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const sortSongs = (songs: Song[]) => {
    return [...songs].sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const fetchSongs = useCallback(async () => {
    try {
      const res = await axios.get(`/api/room/song`, {
        params: {
          roomId,
          ...(userId === hostId ? { hostId } : { userId }),
        },
      });

      if (res.status !== 200) {
        toast.error(res.data.message);
        return;
      }

      const data = res.data as GetSongResponse;

      const songs = data.songs;

      console.log("Fetched songs:", songs);

      if (!songs || songs.length === 0) {
        setCurrentSong(null);
        setUpcomingSongs([]);
        return;
      }

      const newCurrent = songs[0];
      const rest = songs.slice(1);
      setCurrentSong(newCurrent);
      setUpcomingSongs(sortSongs(rest));
    } catch (err) {
      console.error("Error fetching songs", err);
      toast.error("Error fetching songs");
    }
  }, [roomId, userId, hostId]);

  useEffect(() => {
    setRoom({ id: roomId, name, hostId });
    if (roomId) fetchSongs();
  }, [roomId, name, hostId, fetchSongs]);

  const isHost = userId === room?.hostId;

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!roomId || !userId) return;

    if (socketRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${protocol}://${window.location.host}/ws/room`
    );
    socketRef.current = socket;

    console.log("Connecting to WebSocket...");

    socket.onopen = () => {
      console.log("✅ WebSocket opened");

      const payload = {
        type: "JOIN_ROOM",
        payload: { roomId, userId, userName, isHost },
      };

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      } else {
        console.warn("Socket not ready to send message yet");
      }
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "USER_LIST") {
        setUsersInRoom(message.payload);
      }

      if (message.type === "USER_EVENT") {
        const { userName, action, timestamp } = message.payload;
        setUserEvents((prev) => [
          { userName, action, timestamp },
          ...prev.slice(0, 9),
        ]);
      }

      if (message.type === "SONG_ADDED") {
        const newSong = message.payload.song as Song;
        setUpcomingSongs((prev) => {
          if (
            prev.some((s) => s.id === newSong.id) ||
            currentSong?.id === newSong.id
          ) {
            return sortSongs(prev);
          }
          return sortSongs([...prev, newSong]);
        });

        setCurrentSong((prev) => prev || newSong);
      }

      if (message.type === "SONG_ENDED") {
        const videoId = message.payload.videoId as string;

        if (videoId !== currentSong?.extractedId) return;

        handlePlayNextSong(currentSong.id);
        
      }

      if (message.type === "VOTE_CHANGED") {
        const { songId } = message.payload;

        const fetchUpdatedVote = async () => {
          try {
            const res = await axios.get(`/api/room/song/${songId}`, {
              params: isHost ? { hostId } : { userId },
            });

            const updatedSong = res.data.song;

            setUpcomingSongs((prevSongs) =>
              sortSongs(
                prevSongs.map((song) =>
                  song.id === songId ? updatedSong : song
                )
              )
            );
          } catch (err) {
            console.error("Error fetching updated song vote:", err);
          }
        };

        fetchUpdatedVote();
      }
    };

    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
    };

    socket.onclose = (event) => {
      console.warn("🔌 WebSocket closed:", event);
    };

    return () => {
      if (
        socketRef.current?.readyState === WebSocket.OPEN ||
        socketRef.current?.readyState === WebSocket.CONNECTING
      ) {
        socketRef.current.close(1000, "Component unmounted");
      }

      socketRef.current = null;
      console.log("WebSocket closed");
    };
  }, [roomId, userId, hostId, isHost, userName, status, currentSong]);

  const handlePlayNextSong = async (songId: string) => {
    try {
      const response = await axios.delete("/api/room/song", {
        params: {
          roomId,
          songId,
        },
      });
      if (response.status === 200) {
        setCurrentSong(null);

        toast.success("Playing next song...");

        console.log("Current upcomingSongs", upcomingSongs);

        const nextSong = upcomingSongs.shift();

        if (!nextSong) return;

        setCurrentSong(nextSong || null);

        console.log("Next song:", currentSong);
      } else {
        toast.error("Failed to play next song");
      }
    } catch (err) {
      console.error("Failed to play next song:", err);
      toast.error("Failed to play next song");
    }
    // if (socketRef.current?.readyState === WebSocket.OPEN) {
    //   socketRef.current.send(
    //     JSON.stringify({
    //       type: "SONG_DELETED",
    //       payload: { roomId, songId },
    //     })
    //   );
    // }
  };

  useEffect(() => {
    if (userEvents.length === 0) return;
    const timer = setTimeout(
      () => setUserEvents((prev) => prev.slice(1)),
      2000
    );
    return () => clearTimeout(timer);
  }, [userEvents]);

  const handleAddToQueue = async () => {
    if (!youtubeUrl) return;
    try {
      const response = await axios.post("/api/room/song", {
        roomId,
        url: youtubeUrl,
        type: "youtube",
      });

      if (
        response.status === 200 &&
        socketRef.current?.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({
            type: "SONG_ADDED",
            payload: {
              roomId,
              song: response.data.song,
            },
          })
        );
      }
    } catch (err) {
      console.error("Error while adding song", err);
    }

    setYoutubeUrl("");
  };

  const handleVote = async (songId: string, isVoted: boolean) => {
    try {
      const payload = isHost ? { hostId, songId } : { userId, songId };

      if (isVoted) {
        await axios.delete("/api/room/song/vote", { params: payload });
      } else {
        await axios.post("/api/room/song/vote", payload);
      }

      console.log("Vote sent:", { roomId, songId, isVoted });

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "VOTE_CHANGED",
            payload: { roomId, songId, isVoted: !isVoted }, // !isVoted because we just changed it
          })
        );
      }

      const res = await axios.get(`/api/room/song/${songId}`, {
        params: { userId: userId || hostId },
      });

      const updatedSong = res.data.song;

      console.log("Updated song:", updatedSong);

      setUpcomingSongs((prevSongs) =>
        sortSongs(
          prevSongs.map((song) => (song.id === songId ? updatedSong : song))
        )
      );
    } catch (err) {
      console.error("Voting error:", err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error("You’ve already voted.");
      } else {
        toast.error("Vote failed. Please try again.");
      }
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

      <RoomNavbar />

      <AnimatePresence>
        <div className="fixed top-20 right-6 z-30 flex flex-col items-end space-y-1">
          {userEvents.slice(-3).map((event) => (
            <motion.div
              key={event.timestamp} // Ensures unique key
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1 }}
              className={`text-sm font-medium ${
                event.action === "joined" ? "text-green-400" : "text-red-400"
              }`}
            >
              {event.userName} {event.action === "joined" ? "joined" : "left"}{" "}
              the room
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <div className="relative z-10 px-6 py-10 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-[linear-gradient(90deg,#f97316,#fb7185,#f43f5e)] bg-[length:300%_300%] animate-gradient">
              {room?.name}
            </h1>
            <p className="text-zinc-300 mt-1">Host: {userName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowUserList(!showUserList)}
              className="ml-4"
            >
              View Users
            </Button>
            {isHost && (
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 size={18} />
                End Room
              </Button>
            )}
          </div>
        </motion.div>

        {/* Responsive Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Current Song + Input - Top on mobile, right on desktop */}
          <div className="w-full md:w-1/3 space-y-6 order-1 md:order-2">
            {/* Current Song */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 flex flex-col gap-4">
              <YouTubePlayer
                isHost={isHost}
                socket={socketRef.current as WebSocket}
                roomId={roomId}
                userId={userId || ""}
                videoId={currentSong?.extractedId || ""}
              />
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
                    <Image
                      width={300}
                      height={200}
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
        {showUserList && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 w-[300px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Users in Room
                </h3>
                <button
                  onClick={() => setShowUserList(false)}
                  className="text-white hover:text-red-400"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-2 max-h-[300px] overflow-y-auto">
                {usersInRoom.map((name, i) => (
                  <li key={i} className="text-sm text-white/90">
                    • {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
