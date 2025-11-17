export default function ReportsTable({ reports = [] }) {
  return (
    <div className="bg-white shadow rounded overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">Location</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr><td colSpan={4} className="p-4 text-center text-gray-500">No reports</td></tr>
          ) : reports.map(r => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{r.type}</td>
              <td className="p-2">{r.location}</td>
              <td className="p-2 capitalize">{r.status}</td>
              <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
