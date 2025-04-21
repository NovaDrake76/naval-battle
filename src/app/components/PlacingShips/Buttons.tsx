"use client";

import { Ship, PlacedShip } from "../../types";
import { SHIP_TYPES } from "../../utils";

interface IButtons {
  isPlacingShips: boolean;
  remainingShips: Ship[];
  placedShips: PlacedShip[];
  selectedShip: Ship | null;
  setSelectedShip: (ship: Ship | null) => void;
  shipOrientation: "horizontal" | "vertical";
  setShipOrientation: (orientation: "horizontal" | "vertical") => void;
  resetBoard: () => void;
  confirmPlacement: () => void;
}

const Buttons: React.FC<IButtons> = ({
  isPlacingShips,
  remainingShips,
  placedShips,
  selectedShip,
  setSelectedShip,
  shipOrientation,
  setShipOrientation,
  resetBoard,
  confirmPlacement,
}) => {
  const toggleOrientation = () => {
    setShipOrientation(
      shipOrientation === "horizontal" ? "vertical" : "horizontal"
    );
  };

  return (
    <div>
      {isPlacingShips && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {remainingShips.map((ship) => (
              <button
                key={ship.name}
                className={`px-4 py-2 rounded text-black cursor-pointer ${
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
              className="px-4 py-2 bg-gray-200 rounded mr-4 text-black cursor-pointer"
              onClick={toggleOrientation}
            >
              Orientation: {shipOrientation}
            </button>

            <button
              className="px-4 py-2 bg-red-100 rounded text-black cursor-pointer"
              onClick={resetBoard}
            >
              Reset Board
            </button>
          </div>
          <p className="mb-4">
            {selectedShip
              ? `Placing: ${selectedShip.name} (${selectedShip.size} spaces)`
              : "Select a ship"}
          </p>

          {placedShips.length === SHIP_TYPES.length && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer"
              onClick={confirmPlacement}
            >
              Confirm Placement
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Buttons;
