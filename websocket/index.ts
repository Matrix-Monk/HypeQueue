import { WebSocketServer, WebSocket } from "ws";

interface ClientInfo {
  socket: WebSocket;
  roomId: string;
  userId: string;
}

const rooms: Record<string, ClientInfo[]> = {}; // { roomId: [clients...] }


export function setupWebSocketServer(wss: WebSocketServer) {
  console.log("WebSocket Server Initialized");

  wss.on("connection", (socket, req) => {
    console.log("New WebSocket Connection");

    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(socket, msg);
      } catch (error) {
        console.error("Invalid WebSocket message", error);
      }
    });

    socket.on("close", () => {
      handleDisconnect(socket);
    });
  });
}


function handleMessage(socket: WebSocket, msg: any) {
  const { type, payload } = msg;

  if (type === "JOIN_ROOM") {
    const { roomId, userId } = payload;

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push({ socket, roomId, userId });

    console.log(`User ${userId} joined room ${roomId}`);

    broadcastToRoom(roomId, {
      type: "USER_LIST",
      payload: getRoomUserIds(roomId),
    });
  }
}

function handleDisconnect(socket: WebSocket) {
  for (const roomId in rooms) {
    const clients = rooms[roomId];
    const index = clients.findIndex((c) => c.socket === socket);

    if (index !== -1) {
      const userId = clients[index].userId;
      clients.splice(index, 1);

      console.log(`User ${userId} disconnected from room ${roomId}`);

      broadcastToRoom(roomId, {
        type: "USER_LIST",
        payload: getRoomUserIds(roomId),
      });

      if (clients.length === 0) {
        delete rooms[roomId];
      }

      break;
    }
  }
}

function broadcastToRoom(roomId: string, message: any) {
  const clients = rooms[roomId];
  if (!clients) return;

  const data = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.socket.readyState === client.socket.OPEN) {
      client.socket.send(data);
    }
  });
}

function getRoomUserIds(roomId: string): string[] {
  const clients = rooms[roomId];
  if (!clients) return [];
  return clients.map((c) => c.userId);
}






