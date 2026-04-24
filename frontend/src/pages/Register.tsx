import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

interface School { id: string; name: string; }
interface Department { id: string; name: string; school_id: string; }
interface Course { id: string; name: string; department_id: string; }

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    student_id: "", 
    email: "", 
    password: "",
    school_id: "",
    department_id: "",
    course_id: ""
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/auth/schools").then(setSchools).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.school_id) {
      api(`/auth/departments?school_id=${form.school_id}`).then(setDepartments).catch(console.error);
      setForm(f => ({ ...f, department_id: "", course_id: "" }));
    }
  }, [form.school_id]);

  useEffect(() => {
    if (form.department_id) {
      api(`/auth/courses?department_id=${form.department_id}`).then(setCourses).catch(console.error);
      setForm(f => ({ ...f, course_id: "" }));
    }
  }, [form.department_id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api("/auth/register", { method: "POST", body: JSON.stringify(form) });
      navigate("/login");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-2xl mb-4 shadow-lg shadow-indigo-200">🗳️</div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1 text-sm">Join the student voting platform</p>
        </div>

        <div className="card shadow-lg shadow-slate-100">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" className="input" placeholder="Alice Johnson"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
              <input type="text" className="input" placeholder="STU001"
                value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" className="input" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Academic Information</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">School</label>
                <select className="input" value={form.school_id} onChange={e => setForm({ ...form, school_id: e.target.value })} required>
                  <option value="">Select School</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required disabled={!form.school_id}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                <select className="input" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} required disabled={!form.department_id}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 mt-4" disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}