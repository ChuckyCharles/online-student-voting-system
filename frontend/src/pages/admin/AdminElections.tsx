import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function AdminElections() {
  const [elections, setElections] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTimes, setEditTimes] = useState<{ start_time: string; end_time: string }>({ start_time: "", end_time: "" });

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

  function startEdit(e: any) {
    // Convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
    const toLocal = (iso: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      const offset = d.getTimezoneOffset() * 60000; // minutes to ms
      const local = new Date(d.getTime() - offset);
      return local.toISOString().slice(0, 16);
    };
    setEditTimes({
      start_time: toLocal(e.start_time),
      end_time: toLocal(e.end_time),
    });
    setEditingId(e.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTimes({ start_time: "", end_time: "" });
  }

  async function saveTimes(id: string) {
    await api(`/admin/elections/${id}/times`, {
      method: "PATCH",
      body: JSON.stringify({
        start_time: editTimes.start_time ? new Date(editTimes.start_time).toISOString() : null,
        end_time: editTimes.end_time ? new Date(editTimes.end_time).toISOString() : null,
      }),
    });
    setEditingId(null);
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

            {/* Voting period display & edit */}
            <div className="mt-2 text-sm text-slate-600">
              {editingId === e.id ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <label className="text-xs whitespace-nowrap">Start:</label>
                    <input
                      type="datetime-local"
                      value={editTimes.start_time}
                      onChange={ev => setEditTimes({ ...editTimes, start_time: ev.target.value })}
                      className="input text-sm py-1 px-2"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs whitespace-nowrap">End:</label>
                    <input
                      type="datetime-local"
                      value={editTimes.end_time}
                      onChange={ev => setEditTimes({ ...editTimes, end_time: ev.target.value })}
                      className="input text-sm py-1 px-2"
                    />
                  </div>
                  <button onClick={() => saveTimes(e.id)} className="btn-primary btn-sm">Save</button>
                  <button onClick={cancelEdit} className="btn-secondary btn-sm">Cancel</button>
                </div>
              ) : (
                <>
                  <span>
                    Voting period: {e.start_time ? new Date(e.start_time).toLocaleString() : "Not set"} → {e.end_time ? new Date(e.end_time).toLocaleString() : "Not set"}
                  </span>
                  <button onClick={() => startEdit(e)} className="ml-2 text-blue-600 hover:underline text-xs">Edit</button>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
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
              </div>
              <div className="ml-auto">
                <button onClick={() => del(e.id)} className="btn-danger btn-sm">Delete</button>
              </div>
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
