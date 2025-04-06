import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

const voteSchema = z.object({
    roomId: z.string().min(1, { message: "Room ID is required" }),
    songId: z.string().min(1, { message: "Song ID is required" }),
})


export async function POST(req: NextRequest) {

    const session = await getServerSession();

    console.log(session);

    try {
        const { roomId, songId } = await req.json();
    
        const res = await prisma.vote.update({
          where: { id: songId },
          data: {
            votes : {
              increment: 1,
            },
          },
        });
    
        return new Response(
        JSON.stringify({
            message: "Song downvoted",
            songId: res.id,
            vote: res.votes,
        }),
        { status: 200 }
        );
    } catch (error) {
        return new Response(
        JSON.stringify({
            message: "Failed to upvote song",
        }),
        { status: 500 }
        );
    }
}