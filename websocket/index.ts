import { WebSocketServer, WebSocket } from "ws";

interface ClientInfo {
  socket: WebSocket;
  roomId: string;
  userId: string;
  userName: string;
}

const rooms: Record<string, ClientInfo[]> = {}; // { roomId: [clients...] }


export function setupWebSocketServer(wss: WebSocketServer) {
  try {
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
  } catch (error) {
    console.error("Error setting up WebSocket server", error);
  }
}


function handleMessage(socket: WebSocket, msg: any) {
  const { type, payload } = msg;

  if (type === "JOIN_ROOM") {
    const { roomId, userId, userName } = payload;

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push({ socket, roomId, userId, userName });

    console.log(`User ${userName} joined room ${roomId}`);

    broadcastToRoom(roomId, {
      type: "USER_LIST",
      payload: getRoomUserNames(roomId),
    });

    broadcastToRoom(roomId, {
      type: "USER_EVENT",
      payload: { userName, action: "joined", timestamp: Date.now() },
    });
  }


   if (type === "SONG_ADDED") {
     const { roomId, song } = payload;
     broadcastToRoom(roomId, {
       type: "SONG_ADDED",
       payload: { song },
     });
   }
  
  
  if (type === "VOTE_CHANGED") {
    broadcastToRoom(payload.roomId, {
      type: "VOTE_CHANGED",
      payload: {
        songId: payload.songId,
        roomId: payload.roomId,
      },
    });
  }
}

function handleDisconnect(socket: WebSocket) {
  for (const roomId in rooms) {
    const clients = rooms[roomId];
    const index = clients.findIndex((c) => c.socket === socket);

    if (index !== -1) {
      const { userId, userName } = clients[index];
      clients.splice(index, 1);

      console.log(`User ${userName} disconnected from room ${roomId}`);

      broadcastToRoom(roomId, {
        type: "USER_LIST",
        payload: getRoomUserNames(roomId),
      });

      broadcastToRoom(roomId, {
        type: "USER_EVENT",
        payload: { userName, action: "left", timestamp: Date.now() },
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

function getRoomUserNames(roomId: string): string[] {
  const clients = rooms[roomId];
  if (!clients) return [];
  return clients.map((c) => c.userName); 
}






