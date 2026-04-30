import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

type ThemeMode = "light" | "dark" | "system";

interface AdminSettings {
  allowMultipleVotes: boolean;
  voteVerificationRequired: boolean;
 autoPublishResults: boolean;
  maxVoteDurationHours: number;
  allowAbstain: boolean;
  requireEmailConfirmation: boolean;
  enableAuditLog: boolean;
  sessionTimeoutMinutes: number;
  theme: ThemeMode;
}

export default function AdminSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<AdminSettings>({
    allowMultipleVotes: false,
    voteVerificationRequired: true,
    autoPublishResults: false,
    maxVoteDurationHours: 24,
    allowAbstain: true,
    requireEmailConfirmation: true,
    enableAuditLog: true,
    sessionTimeoutMinutes: 60,
    theme: "light",
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api("/admin/settings");
      setSettings(data);
    } catch (err: any) {
      // Fallback to defaults if API fails
      console.error("Failed to load admin settings:", err);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setMessage({ type: "success", text: "Admin settings saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: ThemeMode) => {
    const html = document.documentElement;
    html.classList.remove("dark");
    if (theme === "dark") {
      html.classList.add("dark");
    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark");
      }
    }
  };

  const handleResetSettings = () => {
    const defaults: AdminSettings = {
      allowMultipleVotes: false,
      voteVerificationRequired: true,
      autoPublishResults: false,
      maxVoteDurationHours: 24,
      allowAbstain: true,
      requireEmailConfirmation: true,
      enableAuditLog: true,
      sessionTimeoutMinutes: 60,
      theme: "light",
    };
    setSettings(defaults);
    setShowResetDialog(false);
    applyTheme("light");
    setMessage({ type: "success", text: "Settings reset to defaults" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-enter stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        </div>
        <p className="text-slate-500 text-sm">Configure system-wide election settings and preferences</p>
      </div>

      {/* Success/Error message */}
      {message.text && (
        <div className={`animate-enter stagger-2 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
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

      {/* Election Configuration */}
      <div className="card animate-enter stagger-2">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Election Configuration
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Allow Multiple Votes</p>
                <p className="text-sm text-slate-500">Prevent duplicate voting</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allowMultipleVotes: !settings.allowMultipleVotes })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.allowMultipleVotes ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.allowMultipleVotes ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Require Email Confirmation</p>
                <p className="text-sm text-slate-500">Verify student emails before voting</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, requireEmailConfirmation: !settings.requireEmailConfirmation })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.requireEmailConfirmation ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.requireEmailConfirmation ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Auto-Publish Results</p>
                <p className="text-sm text-slate-500">Automatically publish after election ends</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoPublishResults: !settings.autoPublishResults })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.autoPublishResults ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.autoPublishResults ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Enable Audit Log</p>
                <p className="text-sm text-slate-500">Track all system activities</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableAuditLog: !settings.enableAuditLog })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enableAuditLog ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.enableAuditLog ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Vote Duration (hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.maxVoteDurationHours}
                onChange={(e) => setSettings({ ...settings, maxVoteDurationHours: parseInt(e.target.value) || 24 })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => {
                  setSettings({ ...settings, theme: e.target.value as ThemeMode });
                  applyTheme(e.target.value as ThemeMode);
                }}
                className="input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Rules */}
      <div className="card animate-enter stagger-3">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Voting Rules
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Allow Abstain Votes</p>
              <p className="text-sm text-slate-500">Let students skip a position</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, allowAbstain: !settings.allowAbstain })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.allowAbstain ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.allowAbstain ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Require Vote Verification</p>
              <p className="text-sm text-slate-500">Double-check before final submission</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, voteVerificationRequired: !settings.voteVerificationRequired })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.voteVerificationRequired ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.voteVerificationRequired ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card animate-enter stagger-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveSettings}
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
            onClick={() => setShowResetDialog(true)}
            className="btn-secondary px-6 py-2.5 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </button>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="btn-ghost text-red-600 hover:bg-red-50 px-6 py-2.5 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowResetDialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="text-4xl mb-4 text-center">⚠️</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Reset Settings?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will restore all admin settings to their default values. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSettings}
                className="btn-danger flex-1"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
