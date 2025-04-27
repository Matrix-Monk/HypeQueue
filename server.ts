// server.ts
import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";
import { setupWebSocketServer } from "./websocket"; // <- We'll build this next

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });


const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ server });

  setupWebSocketServer(wss); // ✨ Initialize websocket handling

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
