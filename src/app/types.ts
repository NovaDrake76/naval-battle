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

export interface AttackData {
  attacker: string;
  coordinates: { row: number; col: number };
}

export interface AttackResult {
  attacker: string;
  target: string;
  coordinates: { row: number; col: number };
  hit: boolean;
  shipDestroyed: string | null;
}

export interface GameState {
  player1Map: PlayerMap | null;
  player2Map: PlayerMap | null;
  currentTurn: string;
  gamePhase: "placing" | "attacking";
  gameOver: boolean;
  winner: string | null;
}

export interface PlayerMap {
  playerName: string;
  playerRole: string;
  ships: {
    name: string;
    positions: { row: number; col: number }[];
  }[];
}
