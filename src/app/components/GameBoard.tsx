"use client";

import React, { useState } from "react";
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
import { socket } from "../../socket";

const GameBoard: React.FC<GameBoardProps> = ({
  playerName,
  isPlacingShips,
  playerRole,
}) => {
  const [board, setBoard] = useState<(BoardCell | null)[][]>(
    createEmptyBoard()
  );
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [shipOrientation, setShipOrientation] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  // Add state for preview
  const [previewPosition, setPreviewPosition] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const resetBoard = () => {
    setBoard(createEmptyBoard());
    setPlacedShips([]);
    setSelectedShip(null);
    setPreviewPosition(null);
  };

  const handlePlaceShip = (row: number, col: number) => {
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
    if (placedShips.length === SHIP_TYPES.length) {
      socket.emit("finished_placing", {
        playerName,
        playerRole,
        ships: placedShips.map((ship) => ({
          name: ship.name,
          positions: ship.positions,
        })),
      });
    }
  };

  // Handle mouse enter for preview
  const handleMouseEnter = (row: number, col: number) => {
    if (isPlacingShips && selectedShip) {
      setPreviewPosition({ row, col });
    }
  };

  // Handle mouse leave for preview
  const handleMouseLeave = () => {
    setPreviewPosition(null);
  };

  const randomPlacement = () => {
    // Clear the board first
    const newBoard = createEmptyBoard();
    const newPlacedShips: PlacedShip[] = [];

    // Try placing each ship
    for (const shipType of SHIP_TYPES) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loops

      while (!placed && attempts < maxAttempts) {
        // Randomly choose orientation
        const randOrientation = Math.random() < 0.5 ? "horizontal" : "vertical";

        // Get random position
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);

        // Try to place the ship
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

    // Update states
    setBoard(newBoard);
    setPlacedShips(newPlacedShips);
    setSelectedShip(null);
    setPreviewPosition(null);
  };

  const remainingShips = SHIP_TYPES.filter(
    (ship) => !placedShips.find((placed) => placed.name === ship.name)
  );

  return (
    <div className="p-4 min-w-[800px]">
      <h2 className="text-xl font-bold mb-4">{playerName}&apos;s Board</h2>

      <Buttons
        isPlacingShips={isPlacingShips}
        remainingShips={remainingShips}
        placedShips={placedShips}
        selectedShip={selectedShip}
        setSelectedShip={setSelectedShip}
        shipOrientation={shipOrientation}
        setShipOrientation={setShipOrientation}
        resetBoard={resetBoard}
        confirmPlacement={confirmPlacement}
      />
      {isPlacingShips && (
        <button
          onClick={randomPlacement}
          className="ml-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Random Placement
        </button>
      )}
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
              // Determine cell styling including preview
              let cellClasses = "w-8 h-8 border border-gray-400 ";

              // Check if this is a preview cell
              if (
                isPlacingShips &&
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
                isPlacingShips &&
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
                  onClick={() =>
                    isPlacingShips && handlePlaceShip(rowIndex, colIndex)
                  }
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p>
          Ships placed: {placedShips.length}/{SHIP_TYPES.length}
        </p>
      </div>
    </div>
  );
};

export default GameBoard;
