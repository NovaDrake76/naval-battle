import React from "react";
import { SHIP_TYPES } from "../utils";

interface GameStatusProps {
  currentTurn: string;
  playerRole: string;
  attackedShips: {
    [key: string]: number;
  };
  enemyShipsDestroyed: string[];
}

const GameStatus: React.FC<GameStatusProps> = ({
  currentTurn,
  playerRole,
  attackedShips,
  enemyShipsDestroyed,
}) => {
  const remainingEnemyShips = SHIP_TYPES.filter(
    (ship) => !enemyShipsDestroyed.includes(ship.name)
  );

  const totalHits = Object.values(attackedShips).reduce(
    (sum, hits) => sum + hits,
    0
  );

  let hitStreak =
    currentTurn === playerRole
      ? totalHits - (SHIP_TYPES.length - remainingEnemyShips.length) * 5
      : 0;
  if (hitStreak < 0) hitStreak = 0;

  return (
    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 mb-4 text-black">
      <h3 className="text-lg font-bold mb-2">Game Status</h3>

      <div className="mb-4">
        <div
          className={`text-lg font-medium ${
            currentTurn === playerRole ? "text-green-600" : "text-red-600"
          }`}
        >
          {currentTurn === playerRole
            ? "Your Turn — Hit a ship to get another turn!"
            : "Opponent's Turn — They'll continue until they miss."}
        </div>

        {currentTurn === playerRole && hitStreak > 0 && (
          <div className="mt-1 text-orange-600 font-bold">
            Current Hit Streak: {hitStreak} {hitStreak >= 3 ? "🔥" : ""}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-1">Enemy Fleet Status:</h4>
        <div className="grid grid-cols-2 gap-2">
          {SHIP_TYPES.map((ship) => (
            <div
              key={ship.name}
              className={`p-2 rounded flex items-center 
                ${
                  enemyShipsDestroyed.includes(ship.name)
                    ? "bg-red-100 line-through text-gray-500"
                    : "bg-blue-50"
                }`}
            >
              <div
                className={`w-3 h-3 rounded-full mr-2 ${ship.color.replace(
                  "bg-",
                  ""
                )}`}
              ></div>
              <span>{ship.name}</span>
              <span className="ml-auto">
                {enemyShipsDestroyed.includes(ship.name)
                  ? "Destroyed"
                  : attackedShips[ship.name]
                  ? `Hit: ${attackedShips[ship.name]}/${ship.size}`
                  : "Intact"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-1">Battle Statistics:</h4>
        <ul className="list-disc pl-5">
          <li>
            Enemy Ships Remaining: {remainingEnemyShips.length}/
            {SHIP_TYPES.length}
          </li>
          <li>Ships Destroyed: {enemyShipsDestroyed.length}</li>
          <li>Total Hits: {totalHits}</li>
        </ul>
      </div>
    </div>
  );
};

export default GameStatus;
