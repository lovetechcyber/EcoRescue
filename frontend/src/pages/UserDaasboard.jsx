import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import WeatherCard from "../components/WeatherCard";
import HeatmapSection from "../components/HeatmapSection";
import ReportsTable from "../components/ReportsTable";
import SubmitReportModal from "../components/SubmitReportModal";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import AlertsCard from "../components/AlertsCard";

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [weather, setWeather] = useState(null);
  const [reports, setReports] = useState([]);
  const [ecoPoints, setEcoPoints] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.getWeather(6.5244, 3.3792).then((res) => setWeather(res.data));
    api
      .getHeatmapData(6.5244, 3.3792)
      .then((res) => setReports(res.data.features));
    api
      .get(`/users/${user.id}/eco-points`)
      .then((res) => setEcoPoints(res.data.points));
  }, [user]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get(`/alerts/user/${user.id}`);
        setAlerts(res.data);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };

    fetchAlerts();

    const interval = setInterval(fetchAlerts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    api.get("/reports/nearby?lng=" + user.lng + "&lat=" + user.lat)
      .then(res => setReports(res.data.reports));
  }, [user.lng, user.lat]);

  const handleReportSubmitted = (newReport) => {
    setReports(prev => [newReport, ...prev]);
  };
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="user" />
      <div className="flex-1 flex flex-col overflow-auto">
        <Topbar />
        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Submit New Report
              </button>
            </div>
            <div className="lg:col-span-2">
              <HeatmapSection points={reports} />
            </div>
            <div className="space-y-4">
              <WeatherCard weather={weather} />
              <div className="bg-white shadow rounded p-4">
                <h4 className="font-semibold mb-2">Eco-Points</h4>
                <div className="text-2xl font-bold">{ecoPoints}</div>
              </div>
              <ReportsTable reports={reports} />
              <AlertsCard alerts={alerts} />
            </div>
          </div>
        </main>
      </div>
      <SubmitReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
}
