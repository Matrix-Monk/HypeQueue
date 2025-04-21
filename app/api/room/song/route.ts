import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getYoutubeMetadata } from "@/lib/youtubeMetadata";

var YT_REGEX =
  /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

const songSchema = z.object({
  url: z.string().min(1, { message: "Please select a song" }),
  type: z.enum(["youtube", "spotify"]),
  roomId: z.string().min(1, { message: "Please select room" }),
});

const getSongSchema = z.object({
  roomId: z.string().min(1, { message: "Please select a room" }),
  userId: z.string().optional(),
  hostId: z.string().optional(),
  guestId: z.string().optional(),
});

export async function POST(req: NextResponse) {
  try {
    const { roomId, url, type } = songSchema.parse(await req.json());
    console.log(roomId + " " + url);

    const isYTLink = url.match(YT_REGEX);

    if (!isYTLink) {
      return NextResponse.json({ error: "Wrong url format" }, { status: 411 });
    }

    const extractedId = url.split("?v=")?.[1];

    const metadata = await getYoutubeMetadata(extractedId);

    if (!metadata) {
      return NextResponse.json(
        { error: "Failed to fetch metadata" },
        { status: 500 }
      );
    }
    const { title, artist, thumbnail, duration } = metadata;

    const res = await prisma.song.create({
      data: {
        roomId,
        url,
        extractedId,
        type,
        title,
        artist,
        thumbnail,
        duration: duration?.toString() ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "Song added to the queue",
        songId: res.id,
        title: res.title,
        artist: res.artist,
        thumbnail: res.thumbnail,
        duration: res.duration,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error,
        message: "Failed to add song to the queue",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextResponse) {
  try {
    const url = new URL(req.url);
    const { roomId, userId, hostId, guestId } = getSongSchema.parse({
      roomId: url.searchParams.get("roomId"),
      userId: url.searchParams.get("userId") || undefined,
      hostId: url.searchParams.get("hostId") || undefined,
      guestId: url.searchParams.get("guestId") || undefined,
    });

    if (!roomId) {
      return NextResponse.json(
        { message: "Missing roomId in query params" },
        { status: 400 }
      );
    }

    const rawSongs = await prisma.song.findMany({
      where: {
        roomId,
      },
      include: {
        _count: {
          select: { votes: true }, // 👈 Get count of votes per song
        },
      },
    });

    const voterFilter = hostId
      ? { hostId }
      : userId
      ? { userId }
      : guestId
      ? { guestId }
      : null;

    let votedSongIds: string[] = [];

    if (voterFilter) {
      const votes = await prisma.vote.findMany({
        where: voterFilter,
        select: { songId: true },
      });
      votedSongIds = votes.map((vote) => vote.songId);
    }

    const songs = rawSongs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      url: song.url,
      extractedId: song.extractedId,
      type: song.type,
      thumbnail: song.thumbnail,
      duration: song.duration,
      roomId: song.roomId,
      createdAt: song.createdAt,
      voteCount: song._count.votes,
      isVoted: votedSongIds.includes(song.id),
    }));

    return NextResponse.json(
      {
        message: "Fetched songs",
        songs,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error,
        message: "Failed to fetch songs",
      },
      { status: 500 }
    );
  }
}
