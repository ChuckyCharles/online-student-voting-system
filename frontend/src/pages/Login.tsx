import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      login(data.access_token, data.role, data.name);
      navigate(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-indigo-600 p-14 text-white">
        <span className="text-xl font-bold tracking-tight">🗳️ VoteSystem</span>
        <div>
          <h2 className="text-5xl font-extrabold leading-tight mb-5">Your voice.<br/>Your vote.</h2>
          <p className="text-indigo-200 text-lg mb-10">Secure, anonymous student council elections — built for transparency.</p>
          <div className="space-y-3">
            {["Anonymous — your identity stays private", "One vote per position, enforced at DB level", "Live results once elections close"].map(f => (
              <div key={f} className="flex items-center gap-3 text-indigo-100 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-xs">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-sm">© 2026 Student Voting System</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <div className="text-5xl mb-3">🗳️</div>
            <h1 className="text-2xl font-bold">VoteSystem</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-8 text-sm">Sign in to access your voting portal</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input type="email" className="input" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            No account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
