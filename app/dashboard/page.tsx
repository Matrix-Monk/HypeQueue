"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import CreateRoomModal from "@/components/CreateRoomModel";
import axios from "axios";

interface Room {
  id: string;
  name: string;
  createdAt: string;
  hostId: string;
}

type GetRoomResponse = {
  message: string;
  rooms: Room[];
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const userId = session?.user?.id;

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`/api/room/?hostId=${userId}`);

        console.log("fetched rooms" + res);

        const data = res.data as GetRoomResponse;

        setRooms(data.rooms); // assuming the endpoint returns { rooms: [...] }
      } catch (err) {
        console.error("Error fetching rooms", err);
      }
    };

    if (userId) {
      fetchRooms();
    }
  }, [userId]);

  if (status === "loading") return <p>Loading...</p>;

  if (!userId) {
    return <p> User id not available </p>;
  }

  return (
    <main className="min-h-screen relative">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/img2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.5)",
        }}
      />

      {/* Navbar */}
      <Navbar type="logout" />

      {/* Content */}
      <div className="relative z-10 px-6 py-10 space-y-12">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-[linear-gradient(90deg,#f97316,#fb7185,#f43f5e)] bg-[length:300%_300%] animate-gradient">
            Welcome, {session?.user?.name || "User"}!
          </h1>
          <p className="text-zinc-300 mt-2 text-lg">
            Manage your rooms and vibe up the queue.
          </p>
        </motion.div>

        {/* Rooms Section */}
        <div>
          <CreateRoomModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            hostId={userId}
          />

          <h2 className="text-3xl text-white font-semibold mb-6">Your Rooms</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                ease: "easeOut",
              }}
            >
              <div
                onClick={() => setShowModal(true)}
                className="w-full min-h-36 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative flex flex-col items-center justify-center text-center"
              >
                {/* Status badge */}
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-200 border border-green-400/30">
                  New
                </div>

                {/* Plus Icon */}
                <Plus className="h-15 w-15 text-rose-800 mb-2" />

                {/* Label */}
                <p className="text-rose-100 text-sm font-medium">Create Room</p>
              </div>
            </motion.div>
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: "easeOut",
                }}
              >
                <Link href={`/room/${room.id}`}>
                  <div className="w-full min-h-36 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative">
                    {/* Status badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-200 border border-rose-400/30">
                      Live
                    </div>

                    {/* Room name */}
                    <h3 className="text-base font-semibold text-rose-100 truncate">
                      {room.name}
                    </h3>

                    {/* Created date */}
                    <p className="text-sm text-zinc-400 mt-1">
                      Created on {new Date(room.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
