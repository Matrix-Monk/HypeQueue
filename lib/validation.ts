import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});


export const createRoomSchema = z.object({
  roomName: z.string().min(1, { message: "Room name is required" }),
  hostId: z.string().min(1, { message: "User ID is required" }),
});

export type Song = {
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

export type CreateRoomSchema = z.infer<typeof createRoomSchema>;