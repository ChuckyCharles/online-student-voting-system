import { useEffect, useState } from "react";
import { api } from "../../api";

export default function AdminSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const load = () => api("/admin/schools").then(setSchools);
  useEffect(() => { load(); }, []);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/admin/schools/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editing.name }),
    });
    setEditing(null); load();
  }

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    await api("/admin/schools", {
      method: "POST",
      body: JSON.stringify({ name: form.name }),
    });
    setCreating(false); setForm({ name: "" }); load();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
          <p className="text-slate-500 text-sm mt-1">Manage schools</p>
        </div>
        <button onClick={() => { setCreating(true); setForm({ name: "" }); }} className="btn-primary">
          + Add School
        </button>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-slate-900 mb-5">Create New School</h2>
            <form onSubmit={createSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input className="input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1">Create School</button>
                <button type="button" onClick={() => setCreating(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-slate-900 mb-5">Edit School</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input className="input" value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })} required />
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
              {["School", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {schools.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-900">{s.name}</div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setEditing({ id: s.id, name: s.name })}>
                      Edit
                    </button>
                    <button onClick={async () => { if (confirm("Delete this school?")) { await api(`/admin/schools/${s.id}`, { method: "DELETE" }); load(); } }} className="text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr><td colSpan={2} className="px-5 py-10 text-center text-slate-400">No schools yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
