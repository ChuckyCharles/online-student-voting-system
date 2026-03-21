import { useEffect, useState } from "react";
import { api } from "../../api";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = () => api("/admin/users").then(setUsers);
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    [u.name, u.student_id, u.email].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} registered students</p>
      </div>

      <div className="card mb-4">
        <input className="input" placeholder="🔍  Search by name, student ID, or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Student", "Student ID", "Email", "Joined", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{u.student_id}</td>
                <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={async () => { if (confirm("Delete this student?")) { await api(`/admin/users/${u.id}`, { method: "DELETE" }); load(); } }}
                    className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
