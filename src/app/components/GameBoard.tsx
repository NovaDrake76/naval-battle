"use client";

import React, { useState } from "react";
import { SHIP_TYPES } from "../utils";
import { BoardCell, GameBoardProps, PlacedShip, Ship } from "../types";
import Buttons from "./PlacingShips/Buttons";

const GameBoard: React.FC<GameBoardProps> = ({
  playerName,
  isPlacingShips,
  onShipsPlaced,
}) => {
  const BOARD_SIZE = 10;

  const [board, setBoard] = useState<(BoardCell | null)[][]>(
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null))
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

  //check if its valid position
  const canPlaceShip = (row: number, col: number, ship: Ship | null) => {
    if (!ship) return false;

    //check out of bounds
    if (shipOrientation === "horizontal" && col + ship.size > BOARD_SIZE)
      return false;
    if (shipOrientation === "vertical" && row + ship.size > BOARD_SIZE)
      return false;

    // Check if ship would overlap with another ship or touch another ship (even diagonally)
    for (let i = 0; i < ship.size; i++) {
      const shipRow = shipOrientation === "vertical" ? row + i : row;
      const shipCol = shipOrientation === "horizontal" ? col + i : col;

      // Check if current cell already has a ship
      if (board[shipRow][shipCol] !== null) return false;

      // Check all adjacent cells (including diagonals)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          // Skip checking the current cell
          if (dr === 0 && dc === 0) continue;

          const adjacentRow = shipRow + dr;
          const adjacentCol = shipCol + dc;

          // Skip if adjacent cell is out of bounds
          if (
            adjacentRow < 0 ||
            adjacentRow >= BOARD_SIZE ||
            adjacentCol < 0 ||
            adjacentCol >= BOARD_SIZE
          )
            continue;

          // If there's a ship in an adjacent cell, placement is invalid
          if (board[adjacentRow][adjacentCol] !== null) {
            // Exception: if it's part of the same ship we're currently placing (for previewing)
            let isPartOfCurrentShip = false;
            if (selectedShip) {
              for (let j = 0; j < ship.size; j++) {
                const currentShipRow =
                  shipOrientation === "vertical" ? row + j : row;
                const currentShipCol =
                  shipOrientation === "horizontal" ? col + j : col;
                if (
                  adjacentRow === currentShipRow &&
                  adjacentCol === currentShipCol
                ) {
                  isPartOfCurrentShip = true;
                  break;
                }
              }
            }

            if (!isPartOfCurrentShip) return false;
          }
        }
      }
    }

    return true;
  };

  // Check if cell is part of the preview
  const isPreviewCell = (row: number, col: number) => {
    if (!selectedShip || !previewPosition) return false;

    const previewRow = previewPosition.row;
    const previewCol = previewPosition.col;

    for (let i = 0; i < selectedShip.size; i++) {
      const checkRow =
        shipOrientation === "vertical" ? previewRow + i : previewRow;
      const checkCol =
        shipOrientation === "horizontal" ? previewCol + i : previewCol;

      if (row === checkRow && col === checkCol) return true;
    }

    return false;
  };

  // Get preview color (lighter version of the ship color)
  const getPreviewColor = (color: string) => {
    // Map of colors to their preview versions
    const colorMap: { [key: string]: string } = {
      "bg-blue-500": "bg-blue-200",
      "bg-green-500": "bg-green-200",
      "bg-yellow-500": "bg-yellow-200",
      "bg-orange-500": "bg-orange-200",
      "bg-red-500": "bg-red-200",
    };

    return colorMap[color] || "bg-gray-200";
  };

  const placeShip = (row: number, col: number) => {
    if (!selectedShip || !canPlaceShip(row, col, selectedShip)) return;

    const newBoard = [...board.map((row) => [...row])];
    const newPlacedShips = [...placedShips];

    //check if this ship type is already placed
    const alreadyPlacedIndex = newPlacedShips.findIndex(
      (ship) => ship.name === selectedShip.name
    );
    if (alreadyPlacedIndex !== -1) {
      //remove the old ship from the board
      const oldShip = newPlacedShips[alreadyPlacedIndex];
      oldShip.positions.forEach((pos) => {
        newBoard[pos.row][pos.col] = null;
      });

      newPlacedShips.splice(alreadyPlacedIndex, 1);
    }

    //add the new ship
    for (let i = 0; i < selectedShip.size; i++) {
      const updateRow = shipOrientation === "vertical" ? row + i : row;
      const updateCol = shipOrientation === "horizontal" ? col + i : col;
      newBoard[updateRow][updateCol] = {
        ship: selectedShip.name,
        color: selectedShip.color,
      };
    }

    newPlacedShips.push({
      ...selectedShip,
      positions: Array(selectedShip.size)
        .fill(null)
        .map((_, i) => ({
          row: shipOrientation === "vertical" ? row + i : row,
          col: shipOrientation === "horizontal" ? col + i : col,
        })),
    });

    setBoard(newBoard);
    setPlacedShips(newPlacedShips);
    setSelectedShip(null);
    setPreviewPosition(null);
  };

  const resetBoard = () => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    );
    setPlacedShips([]);
    setSelectedShip(null);
    setPreviewPosition(null);
  };

  const confirmPlacement = () => {
    if (placedShips.length === SHIP_TYPES.length) {
      onShipsPlaced(placedShips);
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
                isPreviewCell(rowIndex, colIndex) &&
                canPlaceShip(
                  previewPosition?.row || 0,
                  previewPosition?.col || 0,
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
                canPlaceShip(rowIndex, colIndex, selectedShip)
              ) {
                cellClasses += " cursor-pointer";
              }

              return (
                <div
                  key={colIndex}
                  className={cellClasses}
                  onClick={() =>
                    isPlacingShips && placeShip(rowIndex, colIndex)
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
