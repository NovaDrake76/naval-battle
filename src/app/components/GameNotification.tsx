import React, { useEffect, useState } from "react";

interface GameNotificationProps {
  message: string;
  type: "info" | "success" | "error" | "warning";
  duration?: number;
}

const GameNotification: React.FC<GameNotificationProps> = ({
  message,
  type,
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(true);

  const backgroundColors = {
    info: "bg-blue-100 border-blue-400",
    success: "bg-green-100 border-green-400",
    error: "bg-red-100 border-red-400",
    warning: "bg-yellow-100 border-yellow-400",
  };

  const textColors = {
    info: "text-blue-700",
    success: "text-green-700",
    error: "text-red-700",
    warning: "text-yellow-700",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className={`p-3 rounded border ${backgroundColors[type]} ${textColors[type]} mb-4 flex justify-between items-center`}
    >
      <span>{message}</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-4 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>
    </div>
  );
};

export default GameNotification;
