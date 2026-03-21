import { useEffect, useState } from "react";
import { api } from "../../api";

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api("/admin/candidates").then(setCandidates);
  useEffect(() => { load(); }, []);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/admin/candidates/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name: editing.name, description: editing.description }) });
    setEditing(null); load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">All Candidates</h1>
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <h2 className="font-semibold mb-4">Edit Candidate</h2>
            <form onSubmit={saveEdit} className="space-y-3">
              <input className="input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} required />
              <input className="input" placeholder="Description" value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{["Name", "Position", "Election", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{c.position?.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.election?.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setEditing({ id: c.id, name: c.name, description: c.description ?? "" })} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={async () => { if (confirm("Delete?")) { await api(`/admin/candidates/${c.id}`, { method: "DELETE" }); load(); } }} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No candidates yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
