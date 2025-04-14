const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Game state
const MAX_PLAYERS = 2;
const players = new Map(); // Store player information
let playerCount = 0;

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        // Handle player joining the game
        socket.on("join_game", () => {
            // Check if game is full
            if (playerCount >= MAX_PLAYERS) {
                socket.emit("game_error", "Game is full. Please try again later.");
                return;
            }

            // Assign player ID (player1 or player2)
            const playerId = `player${playerCount + 1}`;

            // Store player info
            players.set(socket.id, {
                id: playerId,
                name: "",
                ready: false,
                ships: [],
                socket: socket
            });

            playerCount++;

            // Notify player of their assignment
            socket.emit("player_assigned", {
                playerId,
                playerCount
            });

            // Broadcast updated player count to all connected clients
            io.emit("player_count", playerCount);

            console.log(`Player assigned: ${playerId}. Total players: ${playerCount}`);
        });

        // Handle player setting their name
        socket.on("set_name", (name) => {
            const player = players.get(socket.id);
            if (player) {
                player.name = name;
                console.log(`Player ${player.id} set name to ${name}`);
            }
        });

        // Handle player placing ships
        socket.on("ships_placed", ({ ships }) => {
            const player = players.get(socket.id);
            if (player) {
                player.ships = ships;
                console.log(`Player ${player.id} placed ships`);
            }
        });

        // Handle player ready status
        socket.on("player_ready", () => {
            const player = players.get(socket.id);
            if (player) {
                player.ready = true;
                console.log(`Player ${player.id} is ready`);

                // Find opponent and notify them
                for (const [id, otherPlayer] of players.entries()) {
                    if (id !== socket.id) {
                        otherPlayer.socket.emit("opponent_ready");
                    }
                }

                // Check if all players are ready
                let allReady = true;
                if (playerCount === MAX_PLAYERS) {
                    for (const [_, player] of players.entries()) {
                        if (!player.ready) {
                            allReady = false;
                            break;
                        }
                    }

                    if (allReady) {
                        // Start the game
                        io.emit("game_start");
                    }
                }
            }
        });

        // Handle client disconnection
        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);

            // Remove player from the game
            if (players.has(socket.id)) {
                players.delete(socket.id);
                playerCount--;

                // Notify remaining players
                io.emit("player_count", playerCount);
                io.emit("player_disconnected");

                console.log(`Player removed. Total players: ${playerCount}`);
            }
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});