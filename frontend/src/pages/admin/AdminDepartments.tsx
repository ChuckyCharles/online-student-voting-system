import { useEffect, useState } from "react";
import { api } from "../../api";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api("/admin/departments").then(setDepartments);
  useEffect(() => { load(); }, []);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/admin/departments/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({ 
        name: editing.name,
        school_id: editing.school_id
      }),
    });
    setEditing(null); load();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
        <p className="text-slate-500 text-sm mt-1">Manage departments</p>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-slate-900 mb-5">Edit Department</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input className="input" value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">School ID</label>
                <input className="input" value={editing.school_id}
                  onChange={e => setEditing({ ...editing, school_id: e.target.value })} required />
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
              {["Department", "School ID", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {departments.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-900">{d.name}</div>
                </td>
                <td className="px-5 py-3.5">
                  {d.school_id}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setEditing({ id: d.id, name: d.name, school_id: d.school_id })}>
                      Edit
                    </button>
                    <button onClick={async () => { if (confirm("Delete this department?")) { await api(`/admin/departments/${d.id}`, { method: "DELETE" }); load(); } }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-400">No departments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}