import { prisma } from "@/lib/prisma";
import RoomPageContent from "@/components/RoomPageContent";
import React from "react";

// interface Props {
//   params: {
//     roomId: string;
//   };
// }

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    console.log("Room not found");
    return <div>Room not found</div>;
  }

  const { name, hostId } = room;

  return (
    <div>
      <RoomPageContent roomId={roomId} name={name} hostId={hostId} />
    </div>
  );
}
