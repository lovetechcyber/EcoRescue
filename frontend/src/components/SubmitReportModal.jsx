import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { submitReport } from "../services/api";

export default function SubmitReportModal({ isOpen, onClose, onReportSubmitted }) {
  const { user } = useContext(AuthContext);
  const [type, setType] = useState("flood");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("low");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFiles = (e) => setImages(Array.from(e.target.files));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const report = await submitReport({
        type,
        description,
        lng: user.lng || 3.3792,
        lat: user.lat || 6.5244,
        severity,
        metadata: {},
        images,
      });

      onReportSubmitted(report.report); // update heatmap + table
      onClose();
      setType("flood");
      setDescription("");
      setSeverity("low");
      setImages([]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Submit New Report</h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="flood">Flood</option>
            <option value="waste">Waste</option>
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full p-2 border rounded"
            required
          />

          <input type="file" multiple accept="image/*" onChange={handleFiles} />

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
