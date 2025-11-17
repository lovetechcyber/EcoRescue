import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { io } from "socket.io-client";
import api from "../services/api";

// eslint-disable-next-line no-undef
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";

const socket = io("http://localhost:5000"); // Replace with your backend URL

export default function HeatmapSection({ center = [3.3792, 6.5244] }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [points, setPoints] = useState([]);

  // Initialize Mapbox
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v10",
      center,
      zoom: 12,
    });

    mapRef.current.on("load", () => {
      mapRef.current.addSource("heat", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      mapRef.current.addLayer({
        id: "heatmap",
        type: "heatmap",
        source: "heat",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 0, 0, 10, 1],
          "heatmap-radius": 20,
        },
      });
    });
  }, [center]);

  // Load initial data
  useEffect(() => {
    api.get("/reports/heatmap")
      .then((res) => setPoints(res.data.features))
      .catch((err) => console.error(err));
  }, []);

  // Update Mapbox source whenever points change
  useEffect(() => {
    if (mapRef.current && mapRef.current.getSource("heat")) {
      mapRef.current.getSource("heat").setData({
        type: "FeatureCollection",
        features: points.map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
          properties: { score: p.score || 1 },
        })),
      });
    }
  }, [points]);

  // Socket.IO real-time updates
  useEffect(() => {
    socket.on("reportVerified", (report) => {
      setPoints((prev) => [
        ...prev,
        {
          lng: report.location.coordinates[0],
          lat: report.location.coordinates[1],
          score: report.severity === "high" ? 3 : 1,
        },
      ]);
    });

    return () => socket.off("reportVerified");
  }, []);

  return <div ref={containerRef} className="w-full h-[500px] rounded shadow" />;
}
