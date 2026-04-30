import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

interface ProfileData {
  name: string;
  email: string;
  role: string;
  school?: { id: string; name: string };
  department?: { id: string; name: string };
  course?: { id: string; name: string };
  student_id?: string;
  phone?: string;
  avatar_url?: string;
}

interface Session {
  id: string;
  device?: string;
  location?: string;
  last_active: string;
  is_current: boolean;
}

export default function Profile() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [showSignoutDialog, setShowSignoutDialog] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api("/user/profile");
      setProfile(data);
    } catch {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await api("/user/sessions");
      setSessions(data.sessions || []);
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      // Mock for demo
      setSessions([
        { id: "1", device: "Chrome on Windows", location: "Nairobi, KE", last_active: new Date().toISOString(), is_current: false },
        { id: "2", device: "Safari on iPhone", location: "Nairobi, KE", last_active: new Date(Date.now() - 3600000).toISOString(), is_current: true },
      ]);
    }
  };

  useEffect(() => {
    if (showSessionsDialog) loadSessions();
  }, [showSessionsDialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      await api("/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          student_id: profile.student_id,
        }),
      });
      updateUser({ name: profile.name });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  // Handlers
  const handleChangePassword = async (current: string, newPass: string) => {
    try {
      await api("/user/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: newPass }),
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setShowPasswordDialog(false);
    } catch (err: any) {
      throw new Error(err.message || "Failed to change password");
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api("/user/enable-2fa", { method: "POST" });
      alert(`Scan this QR code with your authenticator app:\n\n${response.qr_code}\n\nSecret: ${response.secret}`);
      setShow2FADialog(false);
    } catch (err: any) {
      alert(err.message || "Failed to enable 2FA");
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await api("/user/sessions", { 
        method: "DELETE", 
        body: JSON.stringify({ session_id: sessionId }) 
      });
      setSessions(prev => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      alert(err.message || "Failed to logout session");
    }
  };

  const handleSignOut = () => {
    setShowSignoutDialog(false);
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      await api("/user/account", { method: "DELETE" });
      logout();
      navigate("/login");
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto card text-center py-12">
        <p className="text-slate-500">Profile not found</p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-enter stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        </div>
        <p className="text-slate-500 text-sm">View and edit your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="card animate-enter stagger-2 overflow-hidden">
        {/* Cover gradient */}
        <div className="h-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {/* Avatar */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl">
              👤
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
              <p className="text-sm text-slate-500 capitalize">{profile.role === 'ADMIN' ? 'Administrator' : 'Student'}</p>
            </div>
          </div>

          {/* Success/Error message */}
          {message.text && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === "success" 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.type === "success" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message.text}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="input bg-slate-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
                <input
                  type="text"
                  value={profile.student_id || ""}
                  onChange={(e) => setProfile({ ...profile, student_id: e.target.value })}
                  className="input"
                  placeholder="e.g., 2023-12345"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="input"
                  placeholder="+254 700 000 000"
                />
              </div>

              {/* School */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">School</label>
                <input
                  type="text"
                  value={profile.school?.name || ""}
                  disabled
                  className="input bg-slate-50 cursor-not-allowed"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={profile.department?.name || ""}
                  disabled
                  className="input bg-slate-50 cursor-not-allowed"
                />
              </div>

              {/* Course */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
                <input
                  type="text"
                  value={profile.course?.name || ""}
                  disabled
                  className="input bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6 py-2.5 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn-secondary px-6 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Security Card */}
      <div className="card animate-enter stagger-3">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Account Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Password</p>
              <p className="text-sm text-slate-500">Last changed 30 days ago</p>
            </div>
            <button 
              onClick={() => setShowPasswordDialog(true)}
              className="btn-secondary btn-sm"
            >
              Change Password
            </button>
          </div>
           
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
              <p className="text-sm text-slate-500">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => setShow2FADialog(true)}
              className="btn-secondary btn-sm"
            >
              Enable
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Active Sessions</p>
              <p className="text-sm text-slate-500">Manage your logged-in devices</p>
            </div>
            <button
              onClick={() => setShowSessionsDialog(true)}
              className="btn-secondary btn-sm"
            >
              View Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card animate-enter stagger-4 border-red-200">
        <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
          <div>
            <p className="font-semibold text-red-700">Delete Account</p>
            <p className="text-sm text-red-600">Permanently delete your account and all data</p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="btn-danger btn-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Modals */}

      {/* Change Password Modal */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPasswordDialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button onClick={() => setShowPasswordDialog(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={async (e: React.FormEvent) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const current = (form.current_password as HTMLInputElement).value;
              const newPass = (form.new_password as HTMLInputElement).value;
              const confirm = (form.confirm_password as HTMLInputElement).value;
              
              if (newPass !== confirm) {
                alert("Passwords don't match");
                return;
              }
              if (newPass.length < 8) {
                alert("Password must be at least 8 characters");
                return;
              }
              
              try {
                await handleChangePassword(current, newPass);
                form.reset();
              } catch (err: any) {
                alert(err.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                <input type="password" name="current_password" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input type="password" name="new_password" className="input" minLength={8} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                <input type="password" name="confirm_password" className="input" minLength={8} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordDialog(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enable 2FA Modal */}
      {show2FADialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShow2FADialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Enable Two-Factor Authentication</h3>
              <button onClick={() => setShow2FADialog(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 text-center">
              <div className="p-6 bg-slate-50 rounded-xl">
                <p className="text-4xl mb-4">📱</p>
                <p className="text-sm text-slate-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="w-48 h-48 mx-auto bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-slate-400">QR Code</span>
                </div>
                <p className="text-xs text-slate-500 mt-4 font-mono">OR enter manually: <span className="text-slate-900 font-mono">JBSWY3DPEHPK3PXP</span></p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShow2FADialog(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleEnable2FA()} className="btn-primary flex-1">I've Scanned the QR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showSessionsDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowSessionsDialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
              <button onClick={() => setShowSessionsDialog(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No active sessions</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{session.device || 'Unknown Device'}</p>
                        <p className="text-xs text-slate-500">
                          {session.location || 'Unknown location'} • {new Date(session.last_active).toLocaleString()}
                        </p>
                        {session.is_current && (
                          <span className="text-xs text-emerald-600 font-medium">Current session</span>
                        )}
                      </div>
                    </div>
                    {!session.is_current && (
                      <button
                        onClick={() => handleLogoutSession(session.id)}
                        className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => setShowSessionsDialog(false)} className="btn-secondary w-full">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowDeleteDialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600">Delete Account?</h3>
              <button onClick={() => setShowDeleteDialog(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action is irreversible. All your data, including your votes and profile information, will be permanently deleted.
                </p>
              </div>
              <p className="text-sm text-slate-600">
                To confirm, type <strong className="text-red-600">DELETE</strong> in the box below:
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="input border-red-200 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(""); }} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={async () => {
                    if (deleteConfirm !== "DELETE") {
                      alert("Please type DELETE to confirm");
                      return;
                    }
                    await handleDeleteAccount();
                  }}
                  disabled={deleteConfirm !== "DELETE"}
                  className="btn-danger flex-1 disabled:opacity-50"
                >
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignoutDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowSignoutDialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Sign Out?</h3>
              <button onClick={() => setShowSignoutDialog(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center">
                You'll need to sign in again to access your account.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignoutDialog(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSignOut} className="btn-ghost text-red-600 hover:bg-red-50 border border-red-200 flex-1">
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
