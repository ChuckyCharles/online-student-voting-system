import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { api("/admin/stats").then(setStats); }, []);

  if (!stats) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📊</div><p>Loading…</p></div>
    </div>
  );

  const statCards = [
    { label: "Total Students", value: stats.total_students, icon: "👥", color: "bg-blue-50 text-blue-600" },
    { label: "Votes Cast", value: stats.total_votes, icon: "🗳️", color: "bg-indigo-50 text-indigo-600" },
    { label: "Elections", value: stats.elections.length, icon: "📋", color: "bg-violet-50 text-violet-600" },
    { label: "Active Now", value: stats.elections.filter((e: any) => e.status === "ACTIVE").length, icon: "✅", color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of the voting system</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Elections</h2>
            <Link to="/admin/elections" className="text-xs text-indigo-600 font-semibold hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {stats.elections.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700 font-medium truncate mr-3">{e.title}</span>
                <span className={e.status === "ACTIVE" ? "badge-active" : e.status === "ENDED" ? "badge-ended" : "badge-pending"}>
                  {e.status === "ACTIVE" ? "● Live" : e.status}
                </span>
              </div>
            ))}
            {stats.elections.length === 0 && <p className="text-sm text-slate-400">No elections yet.</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-5">Audit Log</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stats.recent_logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800">{log.action}</span>
                  {log.target && <span className="text-xs text-slate-400"> · {log.target}</span>}
                  <div className="text-xs text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {stats.recent_logs.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
