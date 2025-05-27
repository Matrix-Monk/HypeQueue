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


  const host = await prisma.user.findUnique({
    where: {
      id: hostId,
    },
    select: {
      name: true,
    },
  });

  if (!host) {
    toast.error("Host not found");
    return;
  }

  const { name: hostName } = host;

  return (
    <div>
      <RoomPageContent
        roomId={roomId}
        name={name}
        hostId={hostId}
        hostName={hostName ?? "Unknown Host"}
      />
    </div>
  );
}
