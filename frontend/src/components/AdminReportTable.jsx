import React from "react";
import api from "../services/api";

export default function AdminReportsTable({ reports, onReportUpdated }) {

  const handleAction = async (id, action) => {
    try {
      const res = await api.put(`/reports/${id}/verify`, { action });
      onReportUpdated(res.data.report);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update report");
    }
  };

  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2">Reporter</th>
          <th>Type</th>
          <th>Description</th>
          <th>Severity</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reports.map(r => (
          <tr key={r._id} className="border-b">
            <td className="p-2">{r.reporter.fullName}</td>
            <td>{r.type}</td>
            <td>{r.description}</td>
            <td>{r.severity}</td>
            <td>{r.status}</td>
            <td className="flex gap-2">
              <button
                className="px-2 py-1 bg-green-600 text-white rounded"
                onClick={() => handleAction(r._id, "verify")}
              >
                Verify
              </button>
              <button
                className="px-2 py-1 bg-red-600 text-white rounded"
                onClick={() => handleAction(r._id, "reject")}
              >
                Reject
              </button>
              <button
                className="px-2 py-1 bg-yellow-500 text-white rounded"
                onClick={() => handleAction(r._id, "action_taken")}
              >
                Action Taken
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
