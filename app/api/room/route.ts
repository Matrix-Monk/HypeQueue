import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRoomSchema } from "@/lib/validation";

// const createRoomSchema = z.object({
//   roomName: z.string().min(1, { message: "Room name is required" }),
//   hostId: z.string().min(1, { message: "User ID is required" }),
// });

const getRoomSchema = z.object({
  hostId: z.string().min(1, { message: "User ID is required" }),
});

export async function POST(req: NextRequest) {
  try {
    const { roomName, hostId } = createRoomSchema.parse(await req.json());

    const res = await prisma.room.create({
      data: {
        name: roomName,
        hostId,
      },
    });

    return NextResponse.json(
      {
        message: "Room created",
        roomId: res.id,
        name: res.name,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error,
        message: "Failed to create room",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { hostId } = getRoomSchema.parse({
      hostId: new URL(req.url).searchParams.get("hostId"),
    });

    if (!hostId) {
      return NextResponse.json(
        { message: "Missing hostId in query params" },
        { status: 400 }
      );
    }

    const rooms = await prisma.room.findMany({
      where: {
        hostId,
      },
    });

    return NextResponse.json(
      {
        message: "Fetched rooms",
        rooms,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error,
        message: "Failed to fetch rooms",
      },
      { status: 500 }
    );
  }
}
