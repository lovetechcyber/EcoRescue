// src/components/WeatherCard.jsx
import React from "react";

export default function WeatherCard({ weather }) {
  if (!weather) return <div className="p-4 bg-white shadow rounded">Loading weather...</div>;

  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="text-sm text-gray-500">{weather.name}</div>
      <div className="text-2xl font-bold">{Math.round(weather.main.temp)}°C</div>
      <div className="text-sm capitalize">{weather.weather[0].description}</div>
    </div>
  );
}
