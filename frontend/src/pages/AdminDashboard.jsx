import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatsCard from "../components/StatsCard";
import HeatmapSection from "../components/HeatmapSection";
import ReportsTable from "../components/ReportsTable";
import api from "../services/api";
import AdminReportsTable from "../components/AdminReportsTable";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get("/reports").then(res => setReports(res.data.reports));
  }, []);

  const handleReportUpdated = (updatedReport) => {
    setReports(prev =>
      prev.map(r => (r._id === updatedReport._id ? updatedReport : r))
    );
  };

  useEffect(() => {
    api.get("/admin/dashboard/stats").then(res => setStats(res.data));
    api.get("/admin/reports/all").then(res => setReports(res.data));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-auto">
        <Topbar />
        <main className="p-6 space-y-6">
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <StatsCard title="Users" value={stats.totalUsers} />
              <StatsCard title="Total Reports" value={stats.totalReports} />
              <StatsCard title="Verified Reports" value={stats.verifiedReports} />
              <StatsCard title="Active Sensors" value={stats.activeSensors} />
            </div>
          )}
          <HeatmapSection points={reports} />
                    <AdminReportsTable
            reports={reports}
            onReportUpdated={handleReportUpdated}
          />
          <ReportsTable reports={reports} />
        </main>
      </div>
    </div>
  );
}
