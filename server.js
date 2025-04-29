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
let gameState = {
  player1Map: null,
  player2Map: null,
  currentTurn: "player1", // player1 starts
  gamePhase: "placing",
  gameOver: false,
  winner: null,
};
let assignedRoles = { player1: false, player2: false };

function checkForHit(targetMap, coordinates) {
  if (!targetMap || !targetMap.ships) {
    return { hit: false };
  }

  for (const ship of targetMap.ships) {
    for (const pos of ship.positions) {
      if (pos.row === coordinates.row && pos.col === coordinates.col) {
        //check if this hit destroyed the ship
        const remainingPositions = ship.positions.filter(
          (p) => !(p.row === coordinates.row && p.col === coordinates.col)
        );

        //update the ship's positions, removing the hit position
        ship.positions = remainingPositions;

        //if no positions left, ship is destroyed
        const shipDestroyed =
          remainingPositions.length === 0 ? ship.name : null;

        return {
          hit: true,
          shipDestroyed,
          shipName: ship.name,
        };
      }
    }
  }

  return { hit: false };
}

function checkForVictory(targetMap) {
  if (!targetMap || !targetMap.ships) {
    return false;
  }

  //check if all ships have been destroyed
  return targetMap.ships.every((ship) => ship.positions.length === 0);
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("join_game", () => {
      if (players.size >= MAX_PLAYERS && !gameState.gameOver) {
        socket.emit("game_error", "Game is full. Try again later.");
        return;
      }

      players.set(socket.id, { name: "", socket, id: socket.id });
      io.emit("player_count", players.size);
    });

    socket.on("set_name", (name) => {
      const player = players.get(socket.id);
      if (player) {
        player.name = name;
        console.log(`Player named: ${name}`);

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
        const playerRole = player.role; //player1 or player2
        if (playerRole === "player1") {
          gameState.player1Map = data;
          io.emit("player1_map_set", true);
        } else if (playerRole === "player2") {
          gameState.player2Map = data;
          io.emit("player2_map_set", true);
        }

        if (gameState.player1Map && gameState.player2Map) {
          gameState.gamePhase = "attacking";
          io.emit("both_maps_set");
          io.emit("game_phase_update", "attacking");
          io.emit("turn_update", gameState.currentTurn);
        }
      }
    });

    socket.on("attack", (data) => {
      const { attacker, coordinates } = data;

      if (
        gameState.gamePhase !== "attacking" ||
        gameState.currentTurn !== attacker ||
        gameState.gameOver
      ) {
        socket.emit("game_error", "Invalid attack or not your turn");
        return;
      }

      const targetMap =
        attacker === "player1" ? gameState.player2Map : gameState.player1Map;
      const target = attacker === "player1" ? "player2" : "player1";

      //check if the attack hit a ship
      const { hit, shipDestroyed, shipName } = checkForHit(
        targetMap,
        coordinates
      );

      //send attack result to all players
      io.emit("attack_result", {
        attacker,
        target,
        coordinates,
        hit,
        shipDestroyed,
        shipName,
      });

      //check if this attack resulted in victory
      if (checkForVictory(targetMap)) {
        gameState.gameOver = true;
        gameState.winner = attacker;

        let winnerName = "";
        for (const [_, player] of players.entries()) {
          if (player.role === attacker) {
            winnerName = player.name;
            break;
          }
        }

        io.emit("game_over", { winner: winnerName });
      } else {
        //if it's a hit, don't switch turns, allowing the player to attack again
        //if it's a miss, switch turns
        if (!hit) {
          gameState.currentTurn =
            gameState.currentTurn === "player1" ? "player2" : "player1";
        }

        io.emit("turn_update", gameState.currentTurn);
      }
    });

    socket.on("reset_game", () => {
      gameState = {
        player1Map: null,
        player2Map: null,
        currentTurn: "player1",
        gamePhase: "placing",
        gameOver: false,
        winner: null,
      };

      assignedRoles = { player1: false, player2: false };
      players.clear();

      io.emit("game_reset");
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
