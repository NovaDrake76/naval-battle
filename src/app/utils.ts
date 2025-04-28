import { Ship, BoardCell, PlacedShip } from "./types";

export const SHIP_TYPES: Ship[] = [
  { name: "Carrier", size: 5, color: "bg-blue-500" },
  { name: "Battleship", size: 4, color: "bg-green-500" },
  { name: "Cruiser", size: 3, color: "bg-yellow-500" },
  { name: "Submarine", size: 3, color: "bg-orange-500" },
  { name: "Destroyer", size: 2, color: "bg-red-500" },
];

export const BOARD_SIZE = 10;

export const canPlaceShip = (
  row: number,
  col: number,
  ship: Ship | null,
  board: (BoardCell | null)[][],
  shipOrientation: "horizontal" | "vertical",
  selectedShip: Ship | null
) => {
  if (!ship) return false;

  //check out of bounds
  if (shipOrientation === "horizontal" && col + ship.size > BOARD_SIZE)
    return false;
  if (shipOrientation === "vertical" && row + ship.size > BOARD_SIZE)
    return false;

  //check if ship would overlap with another ship or touch another ship
  for (let i = 0; i < ship.size; i++) {
    const shipRow = shipOrientation === "vertical" ? row + i : row;
    const shipCol = shipOrientation === "horizontal" ? col + i : col;

    //check if current cell already has a ship
    if (board[shipRow][shipCol] !== null) return false;

    //check all adjacent cells (including diagonals)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        //skip checking the current cell
        if (dr === 0 && dc === 0) continue;

        const adjacentRow = shipRow + dr;
        const adjacentCol = shipCol + dc;

        //skip if adjacent cell is out of bounds
        if (
          adjacentRow < 0 ||
          adjacentRow >= BOARD_SIZE ||
          adjacentCol < 0 ||
          adjacentCol >= BOARD_SIZE
        )
          continue;

        //if there's a ship in an adjacent cell, placement is invalid
        if (board[adjacentRow][adjacentCol] !== null) {
          //its ok if it's part of the same ship we're currently placing
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

export const isPreviewCell = (
  row: number,
  col: number,
  selectedShip: Ship | null,
  previewPosition: { row: number; col: number } | null,
  shipOrientation: "horizontal" | "vertical"
) => {
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

export const getPreviewColor = (color: string) => {
  const colorMap: { [key: string]: string } = {
    "bg-blue-500": "bg-blue-200",
    "bg-green-500": "bg-green-200",
    "bg-yellow-500": "bg-yellow-200",
    "bg-orange-500": "bg-orange-200",
    "bg-red-500": "bg-red-200",
  };

  return colorMap[color] || "bg-gray-200";
};

export const createEmptyBoard = () => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
};

export const placeShip = (
  row: number,
  col: number,
  selectedShip: Ship | null,
  board: (BoardCell | null)[][],
  placedShips: PlacedShip[],
  shipOrientation: "horizontal" | "vertical"
) => {
  if (!selectedShip) {
    return { board, placedShips };
  }

  const newBoard = [...board.map((row) => [...row])];
  const newPlacedShips = [...placedShips];

  const alreadyPlacedIndex = newPlacedShips.findIndex(
    (ship) => ship.name === selectedShip.name
  );
  if (alreadyPlacedIndex !== -1) {
    const oldShip = newPlacedShips[alreadyPlacedIndex];
    oldShip.positions.forEach((pos) => {
      newBoard[pos.row][pos.col] = null;
    });

    newPlacedShips.splice(alreadyPlacedIndex, 1);
  }

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

  return { board: newBoard, placedShips: newPlacedShips };
};
