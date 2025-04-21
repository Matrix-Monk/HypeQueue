"use server"
import RoomPageContent from "@/components/RoomPageContent";
import React from 'react'
import {prisma} from '@/lib/prisma'

const page = async({
  params,
}: {
  params: {
    roomId: string;
  };
    }) => {

    const { roomId } =  await params



    const room = await prisma.room.findUnique({
        where: {
            id : roomId
        }
    })

    if (!room) {

        console.log("Room not found")
        return
    }

    console.log("from room page " + roomId)


    const name = room.name

    const hostId = room.hostId
    

    return (
      <div>
        <RoomPageContent roomId={roomId} name={name} hostId = {hostId} />
      </div>
    );
};

export default page

