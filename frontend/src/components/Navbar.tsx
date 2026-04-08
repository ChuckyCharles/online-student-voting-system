import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = user?.role === "ADMIN";

  const links = isAdmin
    ? [
        { to: "/admin", label: "Dashboard" },
        { to: "/admin/elections", label: "Elections" },
        { to: "/admin/candidates", label: "Candidates" },
        { to: "/admin/users", label: "Students" },
        { to: "/admin/audit-logs", label: "Audit Logs" },
      ]
    : [
        { to: "/dashboard", label: "Dashboard" },
      ];

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between h-16 items-center">
        <div className="flex items-center gap-6">
          <Link to={isAdmin ? "/admin" : "/dashboard"}
            className="flex items-center gap-2 font-bold text-slate-900 hover:text-indigo-600 transition-colors">
            <span className="text-xl">🗳️</span><span className="text-lg">VoteSystem</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === l.to
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && <span className="badge-active hidden sm:inline-flex">Admin</span>}
          <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center select-none">
            {initials}
          </div>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="btn-secondary btn-sm hidden sm:inline-flex">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
