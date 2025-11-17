import React from "react";

export default function AlertsCard({ alerts = [] }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <h4 className="font-semibold mb-2">Alerts in Your Area</h4>
      {alerts.length === 0 ? (
        <p className="text-gray-500 text-sm">No alerts at the moment</p>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {alerts.map(alert => (
            <li
              key={alert.id}
              className="border-l-4 border-red-500 bg-red-50 p-2 rounded flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs text-gray-600">{alert.description}</p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(alert.createdAt).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
