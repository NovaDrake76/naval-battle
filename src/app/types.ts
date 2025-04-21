export interface Ship {
  name: string;
  size: number;
  color: string;
}

export interface PlacedShip extends Ship {
  positions: { row: number; col: number }[];
}

export interface GameBoardProps {
  playerName: string;
  isPlacingShips: boolean;
  playerRole: string;
}

export interface BoardCell {
  ship: string;
  color: string;
}
