import { WebSocketServer, WebSocket } from "ws";

interface ClientInfo {
  socket: WebSocket;
  roomId: string;
  userId: string;
  userName: string;
  isHost: boolean;
}

interface Message {
  type: string;
  payload: any;
}

const rooms: Record<string, ClientInfo[]> = {};

// Entry point: Initialize the WebSocket server
export function setupWebSocketServer(wss: WebSocketServer) {
  console.log("✅ WebSocket Server Initialized");

  wss.on("connection", (socket) => {
    console.log("🔌 New WebSocket connection");

    socket.on("message", (data) => {
      try {
        console.log("📨 Received message from client:", data.toString());

        const msg = JSON.parse(data.toString()) as Message;
        handleMessage(socket, msg);
      } catch (error) {
        console.error("❌ Invalid WebSocket message", error);
      }
    });

    socket.on("close", () => {
      handleDisconnect(socket);
    });
  });
}

// Check if a user is the host of a room
function isHostUser(roomId: string, userId: string): boolean {
  const clients = rooms[roomId];
  return clients?.some((c) => c.userId === userId && c.isHost) ?? false;
}

// Handle messages from the client
function handleMessage(socket: WebSocket, msg: Message) {
  try {
    const { type, payload } = msg;

    switch (type) {
      case "JOIN_ROOM": {
        const { roomId, userId, userName, isHost } = payload;

        console.log(
          `🛋️ Room ${roomId} has ${rooms[roomId]?.length} users`,
          rooms
        );

        console.log(
          `👥 Received join request from ${userName} (${userId}) ${roomId} as ${
            isHost ? "host" : "guest"
          }`
        );

        rooms[roomId] = rooms[roomId] || [];

        const existing = rooms[roomId].find((c) => c.userId === userId);

        if (existing) {
          console.warn(`⚠️ User ${userName} already in room ${roomId}`);
          return;
        }

        rooms[roomId].push({ socket, roomId, userId, userName, isHost });

        const host = rooms[roomId]?.find((c) => c.isHost);

        console.log("found host", host);

        if (host && host.userId !== userId) {
          console.log(
            `📢 Notifying host ${host.userName} of new user ${userName} in room ${roomId}`
          );

          if (host.socket.readyState === WebSocket.OPEN) {
            console.log(`✅ Sending USER_JOINED to host ${host.userName}`);

            host.socket.send(
              JSON.stringify({
                type: "USER_JOINED",
                payload: {
                  roomId,
                  userId,
                },
              })
            );
          }
        }

        console.log(`👤 ${userName} joined room ${roomId}`);
        console.log(`📋 Current users:`, getRoomUserNames(roomId));

        console.log(
          `🛋️ Room ${roomId} now has ${rooms[roomId]?.length} users`,
          rooms
        );

        broadcastToRoom(roomId, {
          type: "USER_LIST",
          payload: getRoomUserNames(roomId),
        });

        broadcastToRoom(roomId, {
          type: "USER_EVENT",
          payload: { userName, action: "joined", timestamp: Date.now() },
        });

        break;
      }

      case "SONG_ADDED": {
        const { roomId, song } = payload;

        broadcastToRoom(roomId, {
          type: "SONG_ADDED",
          payload: { song },
        });

        break;
      }

      case "VOTE_CHANGED": {
        const { roomId, songId, isVoted } = payload;

        broadcastToRoom(roomId, {
          type: "VOTE_CHANGED",
          payload: { roomId, songId, isVoted },
        });

        break;
      }

      case "SONG_CHANGED": {
        const { roomId, songId, videoId, nextSong, rest } = payload;

        broadcastToRoom(roomId, {
          type: "SONG_CHANGED",
          payload: { roomId, songId, videoId, rest, nextSong },
        });

        break;
      }

      case "PLAYER_EVENT": {
        const { roomId, userId, action, currentTime, videoId } = payload;

        if (!isHostUser(roomId, userId)) {
          console.warn(
            `🚫 Unauthorized PLAYER_EVENT from ${userId} (not host)`
          );
          return;
        }

        if (action === "ended") {
          console.log(`🎵 Song ended for room ${roomId}`);

          broadcastToRoom(roomId, {
            type: "SONG_ENDED",
            payload: { userId, videoId, roomId },
          });
        }

        broadcastToRoom(roomId, {
          type: "PLAYER_EVENT",
          payload: { userId, action, currentTime, videoId },
        });

        break;
      }

      case "REQUEST_PLAYER_STATE": {
        const { roomId, requesterId } = payload;

        const hostClient = rooms[roomId]?.find((c) => c.isHost);
        if (hostClient && hostClient.socket.readyState === WebSocket.OPEN) {
          hostClient.socket.send(
            JSON.stringify({
              type: "SEND_PLAYER_STATE",
              payload: { toUserId: requesterId },
            })
          );
        }

        break;
      }

      case "PLAYER_STATE_RESPONSE": {
        const { roomId, toUserId, action, currentTime, videoId } = payload;

        const targetClient = rooms[roomId]?.find((c) => c.userId === toUserId);
        if (targetClient && targetClient.socket.readyState === WebSocket.OPEN) {
          targetClient.socket.send(
            JSON.stringify({
              type: "PLAYER_STATE_RESPONSE",
              payload: { toUserId, action, currentTime, videoId },
            })
          );
        }

        break;
      }

      default:
        console.warn(`⚠️ Unknown message type: ${type}`);
    }
  } catch (err) {
    console.error("❌ handleMessage error:", err);
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CLOSING
    ) {
      socket.close();
    }
  }
}

// Handle user disconnection
function handleDisconnect(socket: WebSocket) {
  for (const roomId in rooms) {
    const clients = rooms[roomId];
    const index = clients.findIndex((c) => c.socket === socket);

    if (index !== -1) {
      const { userName } = clients[index];
      clients.splice(index, 1);

      console.log(`❌ ${userName} disconnected from room ${roomId}`);

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

// Broadcast a message to every client in the room
function broadcastToRoom(roomId: string, message: Message) {
  const clients = rooms[roomId];
  if (!clients) return;

  const data = JSON.stringify(message);

  for (const client of clients) {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(data);
    }
  }
}

// Get user names of the room
function getRoomUserNames(roomId: string): string[] {
  return rooms[roomId]?.map((c) => c.userName) ?? [];
}
