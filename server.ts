import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";
import { setupWebSocketServer } from "./websocket/index.js";
import { parse } from "url";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || "3000", 10);

// Prepare Next.js
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  // Create WS server without immediately attaching it
  const wss = new WebSocketServer({ noServer: true });

  // Attach upgrade logic manually
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url || "", true);
    console.log("🔁 Upgrade requested at:", pathname);


    // Allow WebSocket only on /ws/room
    if (pathname === "/ws/room") {
      console.log("✅ Handling WebSocket upgrade...");

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      console.log("❌ Invalid WS upgrade path:", pathname);

      socket.destroy(); // Reject other upgrade attempts
    }
  });

  setupWebSocketServer(wss); // Your custom message handlers

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
