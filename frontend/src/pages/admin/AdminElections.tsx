import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function AdminElections() {
  const [elections, setElections] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = () => api("/admin/elections").then(setElections);
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { await api("/admin/elections", { method: "POST", body: JSON.stringify({ title }) }); setTitle(""); load(); }
    catch (err: any) { setError(err.message); }
  }

  async function updateStatus(id: string, status: string) {
    await api(`/admin/elections/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this election?")) return;
    await api(`/admin/elections/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Manage Elections</h1>
      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Create Election</h2>
        <form onSubmit={create} className="flex gap-3">
          <input className="input flex-1" placeholder="Election title" value={title}
            onChange={e => setTitle(e.target.value)} required />
          <button type="submit" className="btn-primary">Create</button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
      <div className="space-y-4">
        {elections.map((e) => (
          <div key={e.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">{e.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {e.positions?.length ?? 0} positions · {e.positions?.reduce((s: number, p: any) => s + p.candidates.length, 0) ?? 0} candidates
                </p>
              </div>
              <span className={e.status === "ACTIVE" ? "badge-active" : e.status === "ENDED" ? "badge-ended" : "badge-pending"}>{e.status}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {e.status === "PENDING" && <button onClick={() => updateStatus(e.id, "ACTIVE")} className="btn-primary text-sm py-1.5">Start</button>}
              {e.status === "ACTIVE" && <button onClick={() => updateStatus(e.id, "ENDED")} className="btn-secondary text-sm py-1.5">End</button>}
              <Link to={`/admin/elections/${e.id}/positions`} className="btn-secondary text-sm py-1.5">Manage Positions</Link>
              {e.status === "ENDED" && <Link to={`/results/${e.id}`} className="btn-secondary text-sm py-1.5">View Results</Link>}
              <button onClick={() => del(e.id)} className="btn-danger text-sm py-1.5">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
