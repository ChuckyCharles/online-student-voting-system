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
      login(data.access_token, data.role, data.name, data.school_id, data.department_id, data.course_id);
      navigate(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Hidden on small screens */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-blue-600 to-indigo-700 text-white p-12 flex-col justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight mb-8">🗳️ VoteSystem</div>
          <h1 className="text-5xl font-bold leading-tight mb-4">
            Your voice.<br />
            Your vote.
          </h1>
          <p className="text-blue-100 text-lg mb-8">Secure, anonymous student elections — built for transparency.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-100">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
              Anonymous — your identity stays private
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
              One vote per position (DB enforced)
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
              Live results after elections close
            </div>
          </div>
        </div>
        <div className="text-blue-200 text-sm">© {new Date().getFullYear()} Student Voting System</div>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="text-4xl mb-3">🗳️</div>
            <h1 className="text-2xl font-bold">VoteSystem</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-6 text-sm">Sign in to access your voting portal</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="student001@gmail.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            No account?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
