"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import GameBoard from "./components/GameBoard";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [gameState, setGameState] = useState<
    "waiting" | "placing" | "ready" | "playing" | "starting"
  >("waiting");
  const [playerReady, setPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      // request a player id from the server
      socket.emit("join_game");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setGameState("waiting");
      setPlayerId(null);
      setHasSubmittedName(false);
      setPlayerReady(false);
      setOpponentReady(false);
    };

    // handle page reloads by disconnecting the socket
    const handleBeforeUnload = () => {
      socket.disconnect();
    };

    // add event listener for page reloads/closes
    window.addEventListener("beforeunload", handleBeforeUnload);

    const onPlayerAssigned = (data: {
      playerId: string;
      playerCount: number;
    }) => {
      setPlayerId(data.playerId);
      setPlayerCount(data.playerCount);
      // just set player id and count, but don't change game state
    };

    const onPlayerCountUpdate = (count: number) => {
      setPlayerCount(count);
      // only update the player count
    };

    const onOpponentReady = () => {
      setOpponentReady(true);

      // if both players are ready, start the game
      if (playerReady) {
        setGameState("starting");

        // wait 3 seconds then transition to placing ships
        setTimeout(() => {
          setGameState("placing");
        }, 3000);
      }
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

      // remove the event listener when component unmounts
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // ensure the socket is disconnected when component unmounts
      socket.disconnect();
    };
  }, [gameState, playerReady]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
      socket.emit("set_name", playerName);
      setHasSubmittedName(true); // mark that the name has been submitted
    }
  };

  const handlePlayerReady = () => {
    setPlayerReady(true);
    socket.emit("player_ready");

    // if opponent is already ready, start the game
    if (opponentReady) {
      setGameState("starting");

      // wait 3 seconds then transition to placing ships
      setTimeout(() => {
        setGameState("placing");
      }, 3000);
    }
  };

  const handleShipsPlaced = (ships: unknown[]) => {
    socket.emit("ships_placed", { ships });
    setGameState("ready");

    // notify the server that ships are placed
    socket.emit("ships_ready");
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
      </div>

      {isConnected && !hasSubmittedName && (
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
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition duration-200"
            >
              Join Game
            </button>
          </form>
        </div>
      )}

      {isConnected && hasSubmittedName && (
        <div>
          {gameState === "waiting" && (
            <div className="text-center p-8 bg-gray-100 rounded">
              <p className="text-xl text-black">Waiting players...</p>

              {playerCount === 2 && !playerReady && (
                <button
                  onClick={handlePlayerReady}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded text-lg font-medium cursor-pointer hover:bg-green-600 transition duration-200"
                >
                  Ready!
                </button>
              )}

              {playerCount === 2 && playerReady && !opponentReady && (
                <div className="mt-4 p-4 bg-yellow-100 rounded">
                  <p className="font-medium text-black">
                    Waiting for opponent...
                  </p>
                </div>
              )}
            </div>
          )}

          {gameState === "starting" && (
            <div className="text-center p-8 bg-blue-100 rounded">
              <p className="text-xl font-bold">Both players ready!</p>
              <p className="mt-2">Game starting in 3 seconds...</p>
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
                    <p className="font-bold">
                      Opponent is ready! Game will start soon.
                    </p>
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
