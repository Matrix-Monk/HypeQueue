"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRoomSchema } from "@/lib/validation";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type CreateRoomResponse = {
  message: string;
  roomId: string;
  name: string;
};

export default function CreateRoomModal({
  isOpen,
  onClose,
  hostId,
}: {
  isOpen: boolean;
  hostId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  const handleCreateRoom = async () => {
    console.log("handleCreateRoom called");

    if (roomName.trim() == "") {
      setRoomName("");
    }

    const result = createRoomSchema.safeParse({ roomName, hostId });

    if (!result.success) {
      const errors = result.error.format();
      console.log("Client-side validation failed", errors);
      return;
    }

    const response = await axios.post("/api/room", {
      roomName: result.data.roomName,
      hostId: result.data.hostId,
    });

    if (response.status !== 200) {
      console.log("Failed to create room");
      return;
    }

    const data = response.data as CreateRoomResponse;

    const { roomId, message, name } = data;

    toast.success(message, {
      description: `Room "${name}" created successfully!`,
    })

    router.push(`/room/${roomId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl w-[90%] max-w-md text-white relative shadow-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent click bubbling
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-300 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-semibold mb-4 text-rose-100">
              Create a Room
            </h2>
            <input
              type="text"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-3 rounded-md bg-zinc-900/50 border border-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-400 text-white"
            />
            <Button
              onClick={handleCreateRoom}
              className="w-full mt-4 bg-rose-500 hover:bg-rose-600"
            >
              Create Room
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
