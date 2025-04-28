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
let player1Map, player2Map;
let assignedRoles = { player1: false, player2: false };

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

        // Assign roles based on availability, prioritizing player1
        if (!assignedRoles.player1) {
          player.role = "player1";
          assignedRoles.player1 = true;
          console.log(`Assigned role: player1 to ${name}`);
          socket.emit("assigned_role", "player1");
        } else if (!assignedRoles.player2) {
          player.role = "player2";
          assignedRoles.player2 = true;
          console.log(`Assigned role: player2 to ${name}`);
          socket.emit("assigned_role", "player2");
        }

        const allReady = Array.from(players.values()).every((p) => p.name);
        if (players.size === MAX_PLAYERS && allReady) {
          io.emit("game_start");
        }
      }
    });

    socket.on("disconnect", () => {
      const player = players.get(socket.id);
      if (player && player.role) {
        assignedRoles[player.role] = false;
      }
      players.delete(socket.id);
      io.emit("player_count", players.size);
      console.log("Client disconnected", socket.id);
    });

    socket.on("finished_placing", (data) => {
      const player = players.get(socket.id);
      if (player) {
        const playerRole = player.role; // player1 or player2
        if (playerRole === "player1") {
          player1Map = data;
          io.emit("player1_map_set", player1Map);
        } else if (playerRole === "player2") {
          player2Map = data;
          io.emit("player2_map_set", player2Map);
        }

        if (player1Map && player2Map) {
          io.emit("both_maps_set", { player1Map, player2Map });
          console.log(JSON.stringify(player1Map.ships[0].positions));
        }
      }
    });

    socket.on("attack", (attackerId, targetId, coordinates) => {
      const attacker = players.get(attackerId);
      const target = players.get(targetId);

      if (attacker && target) {
        io.emit("attack_result", {
          attacker: attacker.name,
          target: target.name,
          coordinates,
        });
      }
    });

    socket.on("game_over", (winnerId) => {
      const winner = players.get(winnerId);
      if (winner) {
        io.emit("game_over", { winner: winner.name });
      }
    });

    socket.on("reset_game", () => {
      players.clear();
      player1Map = null;
      player2Map = null;
      assignedRoles = { player1: false, player2: false };
      io.emit("game_reset");
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
