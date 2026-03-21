import { useEffect, useState } from "react";
import { api } from "../../api";

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api("/admin/candidates").then(setCandidates);
  useEffect(() => { load(); }, []);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/admin/candidates/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editing.name, description: editing.description }),
    });
    setEditing(null); load();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
        <p className="text-slate-500 text-sm mt-1">Manage all candidates across elections</p>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-slate-900 mb-5">Edit Candidate</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input className="input" value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <input className="input" placeholder="Optional tagline"
                  value={editing.description ?? ""}
                  onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1">Save Changes</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Candidate", "Position", "Election", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {candidates.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-900">{c.name}</div>
                  {c.description && <div className="text-xs text-slate-400 mt-0.5">{c.description}</div>}
                </td>
                <td className="px-5 py-3.5">
                  <span className="badge-pending">{c.position?.name}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[180px] truncate">{c.election?.title}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setEditing({ id: c.id, name: c.name, description: c.description ?? "" })}
                      className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold transition-colors">Edit</button>
                    <button onClick={async () => { if (confirm("Delete this candidate?")) { await api(`/admin/candidates/${c.id}`, { method: "DELETE" }); load(); } }}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No candidates yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
