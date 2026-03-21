import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { api("/admin/stats").then(setStats); }, []);

  if (!stats) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const statCards = [
    { label: "Total Students", value: stats.total_students, icon: "👥" },
    { label: "Total Votes", value: stats.total_votes, icon: "🗳️" },
    { label: "Elections", value: stats.elections.length, icon: "📋" },
    { label: "Active", value: stats.elections.filter((e: any) => e.status === "ACTIVE").length, icon: "✅" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Elections</h2>
            <Link to="/admin/elections" className="text-sm text-blue-600 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {stats.elections.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between">
                <span className="text-sm">{e.title}</span>
                <span className={e.status === "ACTIVE" ? "badge-active" : e.status === "ENDED" ? "badge-ended" : "badge-pending"}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-4">Audit Log</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.recent_logs.map((log: any) => (
              <div key={log.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2">
                <span className="font-medium text-gray-800">{log.action}</span>
                {log.target && <span className="text-gray-500"> → {log.target}</span>}
                <div className="text-gray-400">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
            {stats.recent_logs.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
