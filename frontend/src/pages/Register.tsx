import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", student_id: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api("/auth/register", { method: "POST", body: JSON.stringify(form) });
      navigate("/login");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  const fields = [
    { label: "Full Name", key: "name", type: "text", placeholder: "Alice Johnson" },
    { label: "Student ID", key: "student_id", type: "text", placeholder: "STU001" },
    { label: "Email", key: "email", type: "email", placeholder: "you@university.edu" },
    { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
  ] as const;

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
            {fields.map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input type={type} className="input" placeholder={placeholder}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
              </div>
            ))}
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
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
