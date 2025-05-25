import { useEffect, useRef, useState } from "react";
import { set } from "zod";

export const useRoomWebSocket = ({
  status,
  roomId,
  userId,
  userName,
  isHost,
}: {
  status: string;
  roomId?: string;
  userId?: string;
  userName?: string;
  isHost: boolean;
}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !roomId ||
      !userId ||
      hasConnectedRef.current
    ) {
      return;
    }

    hasConnectedRef.current = true;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${protocol}://${window.location.host}/ws/room`
    );
    socketRef.current = socket;

    socket.onopen = () => {
      const joinPayload = {
        type: "JOIN_ROOM",
        payload: { roomId, userId, userName, isHost },
      };
      socket.send(JSON.stringify(joinPayload));
      setIsConnected(true);
    };
      
      

    socket.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      hasConnectedRef.current = false;
    };

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, "Component unmounted");
      }
      socketRef.current = null;
      hasConnectedRef.current = false;
    };
  }, [status, roomId, userId]);
    
  return {
    socket: socketRef.current,
    isConnected,
  };
};
