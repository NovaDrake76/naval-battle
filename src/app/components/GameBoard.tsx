"use client";

import React, { useState, useEffect } from "react";
import {
  SHIP_TYPES,
  BOARD_SIZE,
  canPlaceShip,
  isPreviewCell,
  getPreviewColor,
  createEmptyBoard,
  placeShip,
} from "../utils";
import { BoardCell, GameBoardProps, PlacedShip, Ship } from "../types";
import Buttons from "./PlacingShips/Buttons";
import GameStatus from "./GameStatus";
import GameNotification from "./GameNotification";
import { socket } from "../../socket";

const GameBoard: React.FC<GameBoardProps> = ({
  playerName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPlacingShips,
  playerRole,
}) => {
  const [board, setBoard] = useState<(BoardCell | null)[][]>(
    createEmptyBoard()
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enemyBoard, setEnemyBoard] = useState<(BoardCell | null)[][]>(
    createEmptyBoard()
  );
  const [attackMarkers, setAttackMarkers] = useState<{
    [key: string]: "hit" | "miss";
  }>({});
  const [enemyAttackMarkers, setEnemyAttackMarkers] = useState<{
    [key: string]: "hit" | "miss";
  }>({});
  const [attackedShips, setAttackedShips] = useState<{ [key: string]: number }>(
    {}
  );
  const [enemyShipsDestroyed, setEnemyShipsDestroyed] = useState<string[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [shipOrientation, setShipOrientation] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  //preview
  const [previewPosition, setPreviewPosition] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [gamePhase, setGamePhase] = useState<"placing" | "attacking">(
    "placing"
  );
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "error" | "warning";
  } | null>(null);
  const [placementConfirmed, setPlacementConfirmed] = useState<boolean>(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);

  useEffect(() => {
    //listen for updates
    socket.on("game_phase_update", (phase) => {
      setGamePhase(phase);
    });

    socket.on("turn_update", (turn) => {
      setCurrentTurn(turn);

      if (turn === playerRole) {
        setNotification({
          message: "Your turn to attack!",
          type: "info",
        });
      } else {
        setNotification({
          message: "Opponent's turn to attack",
          type: "info",
        });
      }
    });

    socket.on("attack_result", (data) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { attacker, target, coordinates, hit, shipDestroyed, shipName } =
        data;

      if (attacker === playerRole) {
        //its our turn!
        const newAttackMarkers = { ...attackMarkers };
        const key = `${coordinates.row}-${coordinates.col}`;
        newAttackMarkers[key] = hit ? "hit" : "miss";
        setAttackMarkers(newAttackMarkers);

        if (hit) {
          setNotification({
            message: `Direct hit on enemy ${shipName}! You get another turn!`,
            type: "success",
          });

          const newAttackedShips = { ...attackedShips };
          newAttackedShips[shipName] = (newAttackedShips[shipName] || 0) + 1;
          setAttackedShips(newAttackedShips);

          if (shipDestroyed) {
            setEnemyShipsDestroyed((prev) => [...prev, shipDestroyed]);

            setTimeout(() => {
              setNotification({
                message: `You've destroyed the enemy ${shipDestroyed}! Keep attacking!`,
                type: "warning",
              });
            }, 1500);
          }
        } else {
          setNotification({
            message: "Your attack missed! Turn passes to opponent.",
            type: "info",
          });
        }
      } else {
        //enemy attack!
        const newEnemyAttackMarkers = { ...enemyAttackMarkers };
        const key = `${coordinates.row}-${coordinates.col}`;
        newEnemyAttackMarkers[key] = hit ? "hit" : "miss";
        setEnemyAttackMarkers(newEnemyAttackMarkers);

        if (hit) {
          setNotification({
            message: "Enemy has hit one of your ships! They get another turn.",
            type: "error",
          });

          if (shipDestroyed) {
            setTimeout(() => {
              setNotification({
                message: `Your ${shipDestroyed} has been destroyed! Enemy continues their turn.`,
                type: "error",
              });
            }, 1500);
          }
        } else {
          setNotification({
            message: "Enemy attack missed! Your turn now.",
            type: "info",
          });
        }
      }
    });

    //listen for game over
    socket.on("game_over", (data) => {
      setWinner(data.winner);

      if (data.winner === playerName) {
        setNotification({
          message: "Congratulations! You won the game!",
          type: "success",
        });
      } else {
        setNotification({
          message: "Game over! You lost this battle.",
          type: "error",
        });
      }
    });

    socket.on("both_maps_set", () => {
      setGamePhase("attacking");
      setWaitingForOpponent(false);
      if (playerRole === "player1") {
        setCurrentTurn("player1");
        setNotification({
          message: "Both players ready! Your turn to attack first!",
          type: "success",
        });
      } else {
        setCurrentTurn("player2");
        setNotification({
          message: "Both players ready! Waiting for opponent to attack first.",
          type: "info",
        });
      }
    });

    // Add listeners for the new events
    socket.on("placement_confirmed", (role) => {
      console.log("Placement confirmed by server for", role);
      if (role === playerRole) {
        setPlacementConfirmed(true);
        setNotification({
          message:
            "Ship placement confirmed! Waiting for opponent to place ships.",
          type: "success",
        });
      }
    });

    socket.on("waiting_for_opponent", () => {
      setWaitingForOpponent(true);
      setNotification({
        message: "Waiting for opponent to finish placing ships...",
        type: "info",
      });
    });

    socket.on("game_reset", () => {
      setGamePhase("placing");
      setPlacementConfirmed(false);
      setWaitingForOpponent(false);
      // Reset boards and other game state
      setBoard(createEmptyBoard());
      setEnemyBoard(createEmptyBoard());
      setPlacedShips([]);
      setAttackMarkers({});
      setEnemyAttackMarkers({});
      setAttackedShips({});
      setEnemyShipsDestroyed([]);
      setSelectedShip(null);
      setPreviewPosition(null);
      setWinner(null);
      console.log("Game reset received, all states cleared");
    });

    return () => {
      socket.off("game_phase_update");
      socket.off("turn_update");
      socket.off("attack_result");
      socket.off("game_over");
      socket.off("both_maps_set");
      socket.off("placement_confirmed");
      socket.off("waiting_for_opponent");
      socket.off("game_reset");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerRole, attackMarkers, enemyAttackMarkers, placementConfirmed]);

  const resetBoard = () => {
    // Only allow reset if placement hasn't been confirmed yet
    if (!placementConfirmed) {
      setBoard(createEmptyBoard());
      setPlacedShips([]);
      setSelectedShip(null);
      setPreviewPosition(null);
    } else {
      setNotification({
        message: "Cannot change ships after placement is confirmed!",
        type: "error",
      });
    }
  };

  const handlePlaceShip = (row: number, col: number) => {
    // Only allow placing ships if placement hasn't been confirmed yet
    if (placementConfirmed) {
      setNotification({
        message: "Cannot change ships after placement is confirmed!",
        type: "error",
      });
      return;
    }

    if (
      !selectedShip ||
      !canPlaceShip(
        row,
        col,
        selectedShip,
        board,
        shipOrientation,
        selectedShip
      )
    )
      return;

    const { board: newBoard, placedShips: newPlacedShips } = placeShip(
      row,
      col,
      selectedShip,
      board,
      placedShips,
      shipOrientation
    );

    setBoard(newBoard);
    setPlacedShips(newPlacedShips);
    setSelectedShip(null);
    setPreviewPosition(null);
  };

  const confirmPlacement = () => {
    if (placementConfirmed) {
      setNotification({
        message: "You've already confirmed your ship placement!",
        type: "warning",
      });
      return;
    }

    if (placedShips.length === SHIP_TYPES.length) {
      setPlacementConfirmed(true);

      socket.emit("finished_placing", {
        playerName,
        playerRole,
        ships: placedShips.map((ship) => ({
          name: ship.name,
          positions: ship.positions,
        })),
      });
    } else {
      setNotification({
        message: `Please place all ships before confirming (${placedShips.length}/${SHIP_TYPES.length})`,
        type: "warning",
      });
    }
  };

  const handleMouseEnter = (row: number, col: number) => {
    // Only show preview if placement hasn't been confirmed yet
    if (gamePhase === "placing" && !placementConfirmed && selectedShip) {
      setPreviewPosition({ row, col });
    }
  };

  const handleMouseLeave = () => {
    setPreviewPosition(null);
  };

  const randomPlacement = () => {
    // Only allow random placement if placement hasn't been confirmed yet
    if (placementConfirmed) {
      setNotification({
        message: "Cannot change ships after placement is confirmed!",
        type: "error",
      });
      return;
    }

    const newBoard = createEmptyBoard();
    const newPlacedShips: PlacedShip[] = [];

    for (const shipType of SHIP_TYPES) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100; //prevent infinite loops

      while (!placed && attempts < maxAttempts) {
        const randOrientation = Math.random() < 0.5 ? "horizontal" : "vertical";

        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);

        if (
          canPlaceShip(row, col, shipType, newBoard, randOrientation, shipType)
        ) {
          const result = placeShip(
            row,
            col,
            shipType,
            newBoard,
            newPlacedShips,
            randOrientation
          );

          Object.assign(newBoard, result.board);
          newPlacedShips.push(
            ...result.placedShips.filter(
              (ship) =>
                ship.name === shipType.name &&
                !newPlacedShips.some((existing) => existing.name === ship.name)
            )
          );
          placed = true;
        }

        attempts++;
      }
    }

    setBoard(newBoard);
    setPlacedShips(newPlacedShips);
    setSelectedShip(null);
    setPreviewPosition(null);
  };

  const handleAttack = (row: number, col: number) => {
    if (
      gamePhase === "attacking" &&
      currentTurn === playerRole &&
      !attackMarkers[`${row}-${col}`] //dont attack already attacked cells
    ) {
      socket.emit("attack", {
        attacker: playerRole,
        coordinates: { row, col },
      });

      setNotification({
        message: `Firing at coordinates ${String.fromCharCode(65 + col)}${
          row + 1
        }...`,
        type: "info",
      });
    } else if (gamePhase === "attacking" && currentTurn !== playerRole) {
      setNotification({
        message: "Wait for your turn!",
        type: "warning",
      });
    } else if (attackMarkers[`${row}-${col}`]) {
      setNotification({
        message: "You've already attacked this position!",
        type: "warning",
      });
    }
  };

  const remainingShips = SHIP_TYPES.filter(
    (ship) => !placedShips.find((placed) => placed.name === ship.name)
  );

  if (gamePhase === "placing") {
    return (
      <div className="p-4 min-w-[800px]">
        <h2 className="text-xl font-bold mb-4">{playerName}&apos;s Board</h2>

        {notification && (
          <GameNotification
            message={notification.message}
            type={notification.type}
            duration={3000}
          />
        )}

        {placementConfirmed && waitingForOpponent && (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded mb-4 text-black">
            <h3 className="font-bold">Ships Placed Successfully!</h3>
            <p>Waiting for opponent to finish placing their ships...</p>
          </div>
        )}

        {!placementConfirmed && (
          <div className="flex items-center">
            <Buttons
              isPlacingShips={true}
              remainingShips={remainingShips}
              placedShips={placedShips}
              selectedShip={selectedShip}
              setSelectedShip={setSelectedShip}
              shipOrientation={shipOrientation}
              setShipOrientation={setShipOrientation}
              resetBoard={resetBoard}
              confirmPlacement={confirmPlacement}
            />
          </div>
        )}

        <div className="flex w-full items-center justify-center">
          <div className="inline-block border-2 border-gray-400 bg-blue-100 ">
            <div className="flex">
              <div className="w-8 h-8"></div>
              {Array(BOARD_SIZE)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 flex items-center justify-center font-bold text-black"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
            </div>

            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                <div className="w-8 h-8 flex items-center justify-center font-bold text-black">
                  {rowIndex + 1}
                </div>

                {row.map((cell, colIndex) => {
                  let cellClasses = "w-8 h-8 border border-gray-400 ";

                  if (
                    !placementConfirmed &&
                    selectedShip &&
                    isPreviewCell(
                      rowIndex,
                      colIndex,
                      selectedShip,
                      previewPosition,
                      shipOrientation
                    ) &&
                    canPlaceShip(
                      previewPosition?.row || 0,
                      previewPosition?.col || 0,
                      selectedShip,
                      board,
                      shipOrientation,
                      selectedShip
                    )
                  ) {
                    cellClasses += getPreviewColor(selectedShip.color);
                  } else if (cell) {
                    cellClasses += cell.color;
                  } else {
                    cellClasses += "bg-white";
                  }

                  if (
                    !placementConfirmed &&
                    selectedShip &&
                    canPlaceShip(
                      rowIndex,
                      colIndex,
                      selectedShip,
                      board,
                      shipOrientation,
                      selectedShip
                    )
                  ) {
                    cellClasses += " cursor-pointer";
                  }

                  return (
                    <div
                      key={colIndex}
                      className={cellClasses}
                      onClick={() => handlePlaceShip(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {!placementConfirmed && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={randomPlacement}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors cursor-pointer"
            >
              Random Placement
            </button>
            <p>
              Ships placed: {placedShips.length}/{SHIP_TYPES.length}
            </p>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Naval Battle - Attack Phase</h2>

        {notification && (
          <GameNotification
            message={notification.message}
            type={notification.type}
            duration={3000}
          />
        )}

        {winner ? (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded mb-4 text-black">
            <h3 className="text-lg font-bold">Game Over!</h3>
            <p>Winner: {winner}</p>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => socket.emit("reset_game")}
            >
              Play Again
            </button>
          </div>
        ) : (
          <GameStatus
            currentTurn={currentTurn}
            playerRole={playerRole}
            attackedShips={attackedShips}
            enemyShipsDestroyed={enemyShipsDestroyed}
          />
        )}

        <div className="flex gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Ships</h3>
            <div className="inline-block border-2 border-gray-400 bg-blue-100">
              <div className="flex">
                <div className="w-8 h-8"></div>
                {Array(BOARD_SIZE)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 flex items-center justify-center font-bold text-black"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
              </div>

              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  <div className="w-8 h-8 flex items-center justify-center font-bold text-black">
                    {rowIndex + 1}
                  </div>

                  {row.map((cell, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const attacked = enemyAttackMarkers[key];

                    let cellClasses =
                      "w-8 h-8 border border-gray-400 relative ";

                    if (cell) {
                      cellClasses += cell.color;
                    } else {
                      cellClasses += "bg-white";
                    }

                    return (
                      <div key={colIndex} className={cellClasses}>
                        {attacked && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${
                              attacked === "hit"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {attacked === "hit" ? "×" : "•"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Enemy board */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Enemy Waters</h3>
            <div className="inline-block border-2 border-gray-400 bg-blue-100">
              <div className="flex">
                <div className="w-8 h-8"></div>
                {Array(BOARD_SIZE)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 flex items-center justify-center font-bold text-black"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
              </div>

              {enemyBoard.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  <div className="w-8 h-8 flex items-center justify-center font-bold text-black">
                    {rowIndex + 1}
                  </div>

                  {row.map((_, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const attacked = attackMarkers[key];

                    let cellClasses =
                      "w-8 h-8 border border-gray-400 bg-blue-50 relative ";

                    //only make cells clickable if it's player's turn and the cell hasn't been attacked
                    if (currentTurn === playerRole && !attacked && !winner) {
                      cellClasses += "cursor-pointer hover:bg-blue-200 ";
                    }

                    return (
                      <div
                        key={colIndex}
                        className={cellClasses}
                        onClick={() => handleAttack(rowIndex, colIndex)}
                      >
                        {attacked && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${
                              attacked === "hit"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {attacked === "hit" ? "×" : "•"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
};
export default GameBoard;
