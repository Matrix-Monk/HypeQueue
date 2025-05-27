import { useEffect, useRef, useState } from "react";

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
    const hasConnectedRef = useRef(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  console.log("useRoomWebSocket initialized with:", {
    status,
    roomId,
    userId,
    userName,
    isHost,
  });

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
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/ws/room`
    );

    ws.onopen = () => {

      const joinPayload = {
        type: "JOIN_ROOM",
        payload: { roomId, userId, userName, isHost },
      };

      console.log("Sending JOIN ROOM with:", joinPayload);

      ws.send(JSON.stringify(joinPayload));
      setIsConnected(true);
    };
      
      

    ws.onclose = () => {
      setIsConnected(false);
      hasConnectedRef.current = false;
    };
     
    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
    };
    
    setSocket(ws);


    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounted");
      }
      hasConnectedRef.current = false;
    };
  }, [status, roomId, userId]);
    
  return {
    socket,
    isConnected,
  };
};
