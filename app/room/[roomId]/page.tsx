"use server";

import { prisma } from "@/lib/prisma";
import RoomPageContent from "@/components/RoomPageContent";
import React from "react";
import { toast } from "sonner";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    toast.error("Room not found");
    return
  }

  const { name, hostId } = room;

  return (
    <div>
      <RoomPageContent roomId={roomId} name={name} hostId={hostId} />
    </div>
  );
}
