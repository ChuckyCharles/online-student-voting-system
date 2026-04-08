import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function AdminElections() {
  const [elections, setElections] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  const load = () => api("/admin/elections").then(setElections);
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      await api("/admin/elections", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", description: "" });
      load();
    } catch (err: any) { setError(err.message); }
  }

  async function updateStatus(id: string, status: string) {
    await api(`/admin/elections/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this election and all its data?")) return;
    await api(`/admin/elections/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Elections</h1>
        <p className="text-slate-500 text-sm mt-1">Create and manage elections</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">New Election</h2>
        <form onSubmit={create} className="space-y-3">
          <input className="input" placeholder="Title — e.g. Student Council Election 2026"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <input className="input" placeholder="Description (optional)"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit" className="btn-primary">Create Election</button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-3">
        {elections.map(e => (
          <div key={e.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{e.title}</h2>
                {e.description && <p className="text-xs text-slate-400 mt-0.5">{e.description}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  {e.positions?.length ?? 0} positions · {e.positions?.reduce((s: number, p: any) => s + p.candidates.length, 0) ?? 0} candidates
                </p>
              </div>
              <span className={e.status === "ACTIVE" ? "badge-active" : e.status === "ENDED" ? "badge-ended" : "badge-pending"}>
                {e.status === "ACTIVE" ? "● Live" : e.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
              {e.status === "PENDING" && (
                <button onClick={() => updateStatus(e.id, "ACTIVE")} className="btn-primary btn-sm">▶ Start</button>
              )}
              {e.status === "ACTIVE" && (
                <button onClick={() => updateStatus(e.id, "ENDED")} className="btn-secondary btn-sm">⏹ End</button>
              )}
              <Link to={`/admin/elections/${e.id}/positions`} className="btn-secondary btn-sm">Manage Positions</Link>
              {e.status === "ENDED" && (
                <Link to={`/results/${e.id}`} className="btn-secondary btn-sm">📊 Results</Link>
              )}
              <button onClick={() => del(e.id)} className="btn-danger btn-sm ml-auto">Delete</button>
            </div>
          </div>
        ))}
        {elections.length === 0 && (
          <div className="card text-center py-12 text-slate-400">
            <div className="text-3xl mb-2">📋</div>
            <p>No elections yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
