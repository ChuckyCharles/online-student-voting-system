import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminElections from "./pages/admin/AdminElections";
import AdminPositions from "./pages/admin/AdminPositions";
import AdminCandidates from "./pages/admin/AdminCandidates";
import AdminUsers from "./pages/admin/AdminUsers";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student routes */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vote/:electionId" element={<Vote />} />
            <Route path="/results/:electionId" element={<Results />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<RequireAuth admin />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/elections" element={<AdminElections />} />
            <Route path="/admin/elections/:id/positions" element={<AdminPositions />} />
            <Route path="/admin/candidates" element={<AdminCandidates />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
