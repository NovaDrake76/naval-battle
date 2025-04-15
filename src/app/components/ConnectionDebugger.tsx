"use client";

import { useEffect, useState } from "react";
import { socket } from "../../socket";

export default function ConnectionDebugger() {
  const [debugInfo, setDebugInfo] = useState({
    connected: false,
    id: null,
    transport: null,
    events: [],
    lastPing: null,
  });

  useEffect(() => {
    const updateInfo = () => {
      if (!socket) return;

      setDebugInfo({
        connected: socket.connected,
        id: socket.id,
        transport: socket?.io?.engine?.transport?.name || "none",
        events: debugInfo.events,
        lastPing: new Date().toISOString(),
      });
    };

    // Record important events
    const recordEvent = (name, data = {}) => {
      const timestamp = new Date().toISOString();
      setDebugInfo((prev) => ({
        ...prev,
        events: [...prev.events.slice(-9), { name, timestamp, data }],
      }));
      updateInfo();
    };

    // Setup event listeners
    if (socket) {
      socket.on("connect", () => recordEvent("connect"));
      socket.on("disconnect", (reason) =>
        recordEvent("disconnect", { reason })
      );
      socket.on("connect_error", (error) =>
        recordEvent("connect_error", { message: error.message })
      );
      socket.on("error", (error) =>
        recordEvent("error", { message: error.message })
      );
      socket.on("reconnect", (attempt) =>
        recordEvent("reconnect", { attempt })
      );
      socket.on("reconnect_attempt", (attempt) =>
        recordEvent("reconnect_attempt", { attempt })
      );
      socket.on("connection_ack", (data) =>
        recordEvent("connection_ack", data)
      );
    }

    // Update status initially and periodically
    updateInfo();
    const interval = setInterval(updateInfo, 5000);

    // Manual connection check button
    const checkConnection = () => {
      recordEvent("manual_check");
      if (socket && !socket.connected) {
        recordEvent("manual_reconnect");
        socket.connect();
      }
    };

    // Expose function to window for debugging
    window.checkSocketConnection = checkConnection;

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("error");
        socket.off("reconnect");
        socket.off("reconnect_attempt");
        socket.off("connection_ack");
      }
    };
  }, [debugInfo.events]);

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-gray-100 border border-gray-300 p-4 m-4 rounded-lg shadow-lg z-50 max-h-96 overflow-auto text-xs font-mono text-black">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Socket Connection Debug</h3>
        <div
          className={`w-3 h-3 rounded-full ${
            debugInfo.connected ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-1 mb-2">
        <div>Status:</div>
        <div>{debugInfo.connected ? "Connected" : "Disconnected"}</div>

        <div>Socket ID:</div>
        <div>{debugInfo.id || "None"}</div>

        <div>Transport:</div>
        <div>{debugInfo.transport}</div>

        <div>Last Check:</div>
        <div>{debugInfo.lastPing?.split("T")[1].split(".")[0] || "Never"}</div>
      </div>

      <div className="mb-2">
        <button
          onClick={() => window.checkSocketConnection?.()}
          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
        >
          Test Connection
        </button>
      </div>

      <div>
        <h4 className="font-bold mb-1">Recent Events:</h4>
        <div className="text-xs overflow-y-auto max-h-32">
          {debugInfo.events.map((event, i) => (
            <div key={i} className="mb-1 pb-1 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="font-bold">{event.name}</span>
                <span>{event.timestamp.split("T")[1].split(".")[0]}</span>
              </div>
              {Object.keys(event.data).length > 0 && (
                <div className="pl-2 text-gray-600">
                  {Object.entries(event.data).map(([key, value]) => (
                    <div key={key}>
                      {key}: {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
