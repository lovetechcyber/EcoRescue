export default function StatsCard({ title, value, icon }) {
  return (
    <div className="bg-white shadow rounded p-4 flex items-center gap-4">
      {icon && <div className="text-2xl">{icon}</div>}
      <div>
        <div className="text-gray-500 text-sm">{title}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
