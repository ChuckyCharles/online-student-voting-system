import { useEffect, useState } from "react";
import { api } from "../../api";

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-blue-50 text-blue-700",
  REGISTER: "bg-violet-50 text-violet-700",
  VOTE_CAST: "bg-emerald-50 text-emerald-700",
  CREATE_ELECTION: "bg-indigo-50 text-indigo-700",
  UPDATE_ELECTION_STATUS: "bg-amber-50 text-amber-700",
  DELETE_ELECTION: "bg-red-50 text-red-700",
  CREATE_POSITION: "bg-indigo-50 text-indigo-700",
  DELETE_POSITION: "bg-red-50 text-red-700",
  CREATE_CANDIDATE: "bg-indigo-50 text-indigo-700",
  UPDATE_CANDIDATE: "bg-amber-50 text-amber-700",
  DELETE_CANDIDATE: "bg-red-50 text-red-700",
  DELETE_USER: "bg-red-50 text-red-700",
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/audit-logs?limit=200").then(setLogs).finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? logs.filter(l => l.action.includes(filter.toUpperCase()) || l.user_id.includes(filter))
    : logs;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">All system actions — {logs.length} entries</p>
      </div>

      <div className="card mb-4">
        <input className="input" placeholder="🔍  Filter by action or user ID…"
          value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {loading ? (
        <div className="card text-center py-12 text-slate-400 animate-pulse">Loading logs…</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Action", "User ID", "Target", "IP Address", "Time"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`badge text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500 max-w-[140px] truncate">{log.user_id}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 max-w-[160px] truncate">{log.target ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 font-mono">{log.ip_address ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
