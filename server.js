const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const MAX_PLAYERS = 2;
const players = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("join_game", () => {
      if (players.size >= MAX_PLAYERS) {
        socket.emit("game_error", "Game is full. Try again later.");
        return;
      }

      players.set(socket.id, { name: "", socket });
      io.emit("player_count", players.size);
    });

    socket.on("set_name", (name) => {
      const player = players.get(socket.id);
      if (player) {
        player.name = name;
        console.log(`Player named: ${name}`);

        const allReady = Array.from(players.values()).every((p) => p.name);
        if (players.size === MAX_PLAYERS && allReady) {
          io.emit("game_start");
        }
      }
    });

    socket.on("disconnect", () => {
      players.delete(socket.id);
      io.emit("player_count", players.size);
      console.log("Client disconnected", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
