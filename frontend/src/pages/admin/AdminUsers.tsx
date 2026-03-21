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
      <h1 className="text-2xl font-bold mb-8">Manage Students</h1>
      <div className="card mb-6">
        <input className="input" placeholder="Search by name, student ID, or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{["Name", "Student ID", "Email", "Registered", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.student_id}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={async () => { if (confirm("Delete student?")) { await api(`/admin/users/${u.id}`, { method: "DELETE" }); load(); } }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
