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

  //check if its valid position
  const canPlaceShip = (row: number, col: number, ship: Ship | null) => {
    if (!ship) return false;

    //check out of bounds
    if (shipOrientation === "horizontal" && col + ship.size > BOARD_SIZE)
      return false;
    if (shipOrientation === "vertical" && row + ship.size > BOARD_SIZE)
      return false;

    //check overlapping
    for (let i = 0; i < ship.size; i++) {
      const checkRow = shipOrientation === "vertical" ? row + i : row;
      const checkCol = shipOrientation === "horizontal" ? col + i : col;
      if (board[checkRow][checkCol] !== null) return false;
    }

    return true;
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

    //remove the ship from selection after placing
    setSelectedShip(null);
  };

  const resetBoard = () => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    );
    setPlacedShips([]);
    setSelectedShip(null);
  };

  const confirmPlacement = () => {
    if (placedShips.length === SHIP_TYPES.length) {
      onShipsPlaced(placedShips);
    }
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

            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`w-8 h-8 border border-gray-400  ${
                  cell ? cell.color : "bg-white"
                } 
                  ${
                    isPlacingShips &&
                    selectedShip &&
                    canPlaceShip(rowIndex, colIndex, selectedShip)
                      ? "cursor-pointer hover:bg-gray-200"
                      : ""
                  }`}
                onClick={() => isPlacingShips && placeShip(rowIndex, colIndex)}
              />
            ))}
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
