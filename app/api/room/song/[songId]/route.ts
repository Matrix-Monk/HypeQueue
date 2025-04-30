import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await context.params;
    const url = new URL(req.url);

    const userId = url.searchParams.get("userId") || undefined;
    const hostId = url.searchParams.get("hostId") || undefined;
    const guestId = url.searchParams.get("guestId") || undefined;

    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        _count: { select: { votes: true } },
      },
    });

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const existingVote = await prisma.vote.findFirst({
      where: {
        songId,
        OR: [{ userId }, { hostId }, { guestId }],
      },
    });

    return NextResponse.json({
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        voteCount: song._count.votes,
        isVoted: !!existingVote,
        thumbnail: song.thumbnail,
      },
    });
  } catch (err) {
    console.error("Fetch song vote error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
