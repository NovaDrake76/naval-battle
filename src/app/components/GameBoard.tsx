import React, { useState } from "react";

interface Ship {
  name: string;
  size: number;
  color: string;
}

interface PlacedShip extends Ship {
  positions: { row: number; col: number }[];
}

interface GameBoardProps {
  playerName: string;
  isPlacingShips: boolean;
  onShipsPlaced: (ships: PlacedShip[]) => void;
}

interface BoardCell {
  ship: string;
  color: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  playerName,
  isPlacingShips,
  onShipsPlaced,
}) => {
  const BOARD_SIZE = 10;
  const SHIP_TYPES: Ship[] = [
    { name: "Carrier", size: 5, color: "bg-blue-500" },
    { name: "Battleship", size: 4, color: "bg-green-500" },
    { name: "Cruiser", size: 3, color: "bg-yellow-500" },
    { name: "Submarine", size: 3, color: "bg-orange-500" },
    { name: "Destroyer", size: 2, color: "bg-red-500" },
  ];

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

  // Handle orientation toggle
  const toggleOrientation = () => {
    setShipOrientation(
      shipOrientation === "horizontal" ? "vertical" : "horizontal"
    );
  };

  // Check if a ship can be placed at the given position
  const canPlaceShip = (row: number, col: number, ship: Ship | null) => {
    if (!ship) return false;

    // Check if the ship would go out of bounds
    if (shipOrientation === "horizontal" && col + ship.size > BOARD_SIZE)
      return false;
    if (shipOrientation === "vertical" && row + ship.size > BOARD_SIZE)
      return false;

    // Check if the ship would overlap with another ship
    for (let i = 0; i < ship.size; i++) {
      const checkRow = shipOrientation === "vertical" ? row + i : row;
      const checkCol = shipOrientation === "horizontal" ? col + i : col;
      if (board[checkRow][checkCol] !== null) return false;
    }

    return true;
  };

  // Place a ship on the board
  const placeShip = (row: number, col: number) => {
    if (!selectedShip || !canPlaceShip(row, col, selectedShip)) return;

    const newBoard = [...board.map((row) => [...row])];
    const newPlacedShips = [...placedShips];

    // Check if this ship type is already placed
    const alreadyPlacedIndex = newPlacedShips.findIndex(
      (ship) => ship.name === selectedShip.name
    );
    if (alreadyPlacedIndex !== -1) {
      // Remove the old ship from the board
      const oldShip = newPlacedShips[alreadyPlacedIndex];
      oldShip.positions.forEach((pos) => {
        newBoard[pos.row][pos.col] = null;
      });

      // Remove the ship from the placed ships array
      newPlacedShips.splice(alreadyPlacedIndex, 1);
    }

    // Add the new ship
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

    // Remove the ship from selection after placing
    setSelectedShip(null);
  };

  // Reset the board and all placed ships
  const resetBoard = () => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    );
    setPlacedShips([]);
    setSelectedShip(null);
  };

  // Confirm ships placement
  const confirmPlacement = () => {
    if (placedShips.length === SHIP_TYPES.length) {
      onShipsPlaced(placedShips);
    }
  };

  // Remaining ships to place
  const remainingShips = SHIP_TYPES.filter(
    (ship) => !placedShips.find((placed) => placed.name === ship.name)
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{playerName}'s Board</h2>

      {isPlacingShips && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {remainingShips.map((ship) => (
              <button
                key={ship.name}
                className={`px-4 py-2 rounded text-black ${
                  selectedShip?.name === ship.name
                    ? "ring-2 ring-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedShip(ship)}
              >
                {ship.name} ({ship.size})
              </button>
            ))}
          </div>

          <div className="mb-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded mr-4 text-black"
              onClick={toggleOrientation}
            >
              Orientation: {shipOrientation}
            </button>

            <button
              className="px-4 py-2 bg-red-100 rounded text-black"
              onClick={resetBoard}
            >
              Reset Board
            </button>
          </div>

          {selectedShip && (
            <p className="mb-4">
              Placing: {selectedShip.name} ({selectedShip.size} spaces)
            </p>
          )}

          {placedShips.length === SHIP_TYPES.length && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={confirmPlacement}
            >
              Confirm Placement
            </button>
          )}
        </div>
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
