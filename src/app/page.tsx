"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import GameBoard from "./components/GameBoard";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      socket.emit("join_game");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setHasSubmittedName(false);
      setGameStarted(false);
    };

    const onGameStart = () => {
      setGameStarted(true);
    };

    const onPlayerCountUpdate = (count: number) => {
      setPlayerCount(count);
    };

    const onGameError = (message: string) => {
      setErrorMessage(message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game_start", onGameStart);
    socket.on("player_count", onPlayerCountUpdate);
    socket.on("game_error", onGameError);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game_start", onGameStart);
      socket.off("player_count", onPlayerCountUpdate);
      socket.off("game_error", onGameError);
      socket.disconnect();
    };
  }, []);

  const handleNameSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (playerName.trim()) {
      socket.emit("set_name", playerName);
      setHasSubmittedName(true);
    }
  };

  return (
    <main className="min-h-screen p-8 flex">
      <div className="w-1/6 br">
        <h1 className="text-3xl font-bold mb-6">Naval Battle</h1>

        {errorMessage && (
          <div className="bg-red-100 border text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <p>Connection: {isConnected ? "Connected" : "Disconnected"}</p>
        <p>Players online: {playerCount}/2</p>

        {!hasSubmittedName && isConnected && (
          <form
            onSubmit={handleNameSubmit}
            className=" gap-2 mt-4 flex flex-col"
          >
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="px-4 py-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
              onClick={handleNameSubmit}
            >
              Join Game
            </button>
          </form>
        )}
        {gameStarted ? "Game Started!" : "Waiting for players..."}
      </div>

      <div className="w-5/6 flex justify-center items-center">
        {gameStarted && hasSubmittedName && (
          <div className="mt-6">
            <GameBoard
              playerName={playerName}
              isPlacingShips={true}
              onShipsPlaced={() => {}}
            />
          </div>
        )}
      </div>
    </main>
  );
}
