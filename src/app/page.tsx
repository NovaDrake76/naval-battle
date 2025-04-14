"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import GameBoard from "./components/GameBoard";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<"waiting" | "placing" | "ready" | "playing">("waiting");
  const [opponentReady, setOpponentReady] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      // Request a player ID from the server
      socket.emit("join_game");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setGameState("waiting");
      setPlayerId(null);
    };

    const onPlayerAssigned = (data: { playerId: string, playerCount: number }) => {
      setPlayerId(data.playerId);
      setPlayerCount(data.playerCount);

      // If we're the first player, we're waiting
      // If we're the second player, we can start placing ships
      if (data.playerCount === 2) {
        setGameState("placing");
      }
    };

    const onPlayerCountUpdate = (count: number) => {
      setPlayerCount(count);
      if (count === 2 && gameState === "waiting") {
        setGameState("placing");
      }
    };

    const onOpponentReady = () => {
      setOpponentReady(true);
    };

    const onGameError = (message: string) => {
      setErrorMessage(message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("player_assigned", onPlayerAssigned);
    socket.on("player_count", onPlayerCountUpdate);
    socket.on("opponent_ready", onOpponentReady);
    socket.on("game_error", onGameError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("player_assigned", onPlayerAssigned);
      socket.off("player_count", onPlayerCountUpdate);
      socket.off("opponent_ready", onOpponentReady);
      socket.off("game_error", onGameError);
    };
  }, [gameState]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
      socket.emit("set_name", playerName);
    }
  };

  const handleShipsPlaced = (ships: any[]) => {
    socket.emit("ships_placed", { ships });
    setGameState("ready");

    // Notify the server that this player is ready
    socket.emit("player_ready");
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Naval Battle</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">
        <p>Connection status: {isConnected ? "Connected" : "Disconnected"}</p>
        <p>Players online: {playerCount}/2</p>
        {playerId && <p>You are Player {playerId}</p>}
      </div>

      {isConnected && !playerName && (
        <div className="mb-6">
          <form onSubmit={handleNameSubmit} className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="px-4 py-2 border rounded"
              required
            />
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              Join Game
            </button>
          </form>
        </div>
      )}

      {isConnected && playerName && (
        <div>
          {gameState === "waiting" && (
            <div className="text-center p-8 bg-gray-100 rounded">
              <p className="text-xl">Waiting for another player to join...</p>
            </div>
          )}

          {(gameState === "placing" || gameState === "ready") && (
            <div>
              <GameBoard
                playerName={playerName}
                isPlacingShips={gameState === "placing"}
                onShipsPlaced={handleShipsPlaced}
              />

              {gameState === "ready" && (
                <div className="mt-4 p-4 bg-green-100 rounded">
                  <p>Your ships are placed! Waiting for opponent...</p>
                  {opponentReady && (
                    <p className="font-bold">Opponent is ready! Game will start soon.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}