import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust this import to your project structure
import z from "zod";

const voteSchema = z
  .object({
    songId: z.string().min(1, "songId is required"),
    hostId: z.string().optional(),
    userId: z.string().optional(),
    guestId: z.string().optional(),
  })
  .refine(
    (data) => {
      const ids = [data.hostId, data.userId, data.guestId].filter(Boolean);
      return ids.length === 1;
    },
    {
      message: "Exactly one of hostId, userId, or guestId must be provided zod",
      path: ["hostId", "userId", "guestId"], // can appear on all three fields
    }
  );

export async function POST(req: NextRequest) {
  try {
    const body = voteSchema.parse(await req.json());
    const { songId, hostId, userId, guestId } = body;

    // Step 1: Validate input
    if (!songId) {
      return NextResponse.json(
        { error: "Please select a song" },
        { status: 400 }
      );
    }

    const actorIds = [hostId, userId, guestId].filter(Boolean);

    if (actorIds.length !== 1) {
      return NextResponse.json(
        { error: "Exactly one of hostId, userId, or guestId must be provided" },
        { status: 400 }
      );
    }

    // Step 2: Check for existing vote
    const existingVote = await prisma.vote.findFirst({
      where: {
        songId,
        OR: [
          { hostId: hostId || undefined },
          { userId: userId || undefined },
          { guestId: guestId || undefined },
        ],
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "Already voted on this song" },
        { status: 409 }
      );
    }

    // Step 3: Create vote
    let voteData: any = {
      songId,
      votes: 1,
    };

    if (hostId) voteData.hostId = hostId;
    if (userId) voteData.userId = userId;
    if (guestId) voteData.guestId = guestId;

    const vote = await prisma.vote.create({ data: voteData });

    return NextResponse.json(
      { message: "Vote created", vote },
      { status: 201 }
    );
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const data = voteSchema.parse(body);

    const { songId, hostId, userId, guestId } = data;

    const existingVote = await prisma.vote.findFirst({
      where: {
        songId,
        OR: [
          { hostId: hostId || undefined },
          { userId: userId || undefined },
          { guestId: guestId || undefined },
        ],
      },
    });

    if (!existingVote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    await prisma.vote.delete({
      where: { id: existingVote.id },
    });

    return NextResponse.json({ message: "Vote removed" }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }

    console.error("Vote deletion error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
