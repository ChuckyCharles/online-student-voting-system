import { useEffect, useState } from "react";
import { api } from "../../api";

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", department_id: "" });

  const load = () => {
    Promise.all([
      api("/admin/courses").then(setCourses),
      api("/admin/departments").then(setDepartments)
    ]);
  };
  useEffect(() => { load(); }, []);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/admin/courses/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({ 
        name: editing.name, 
        code: editing.code,
        department_id: editing.department_id 
      }),
    });
    setEditing(null); load();
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    await api("/admin/courses", {
      method: "POST",
      body: JSON.stringify({ 
        name: form.name, 
        code: form.code || null,
        department_id: form.department_id 
      }),
    });
    setCreating(false); setForm({ name: "", code: "", department_id: "" }); load();
  }

  const getDepartmentName = (deptId: string) => {
    return departments.find((d: any) => d.id === deptId)?.name || deptId;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-500 text-sm mt-1">Manage courses and classes</p>
        </div>
        <button onClick={() => { setCreating(true); setForm({ name: "", code: "", department_id: "" }); }} className="btn-primary">
          + Add Course
        </button>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-slate-900 mb-5">Create New Course</h2>
            <form onSubmit={createCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name</label>
                <input className="input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Code (optional)</label>
                <input className="input" value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., CS101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select className="input" value={form.department_id}
                  onChange={e => setForm({ ...form, department_id: e.target.value })} required>
                  <option value="">Select a department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1">Create Course</button>
                <button type="button" onClick={() => setCreating(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-slate-900 mb-5">Edit Course</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name</label>
                <input className="input" value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Code (optional)</label>
                <input className="input" value={editing.code || ""}
                  onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="e.g., CS101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select className="input" value={editing.department_id || ""}
                  onChange={e => setEditing({ ...editing, department_id: e.target.value })} required>
                  <option value="">Select a department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
              {["Course", "Code", "Department", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courses.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-900">{c.name}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-slate-500">{c.code || "-"}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-slate-700">{getDepartmentName(c.department_id)}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setEditing({ 
                      id: c.id, 
                      name: c.name, 
                      code: c.code || "",
                      department_id: c.department_id 
                    })}>
                      Edit
                    </button>
                    <button onClick={async () => { 
                      if (confirm("Delete this course? This will also affect any associated class representatives and student enrollments.")) { 
                        await api(`/admin/courses/${c.id}`, { method: "DELETE" }); 
                        load(); 
                      } 
                    }} className="text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No courses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
