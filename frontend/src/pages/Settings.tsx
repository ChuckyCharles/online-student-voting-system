import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

type ThemeMode = "light" | "dark" | "system";
type NotificationPref = "all" | "important" | "none";

interface SettingsData {
  theme: ThemeMode;
  notifications: NotificationPref;
  emailNotifications: boolean;
  voteReminders: boolean;
  resultsAlerts: boolean;
  language: string;
  timezone: string;
}

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<SettingsData>({
    theme: "light",
    notifications: "all",
    emailNotifications: true,
    voteReminders: true,
    resultsAlerts: true,
    language: "en",
    timezone: "EAT",
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSignoutDialog, setShowSignoutDialog] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const savedSettings = localStorage.getItem("user-settings");
    
    if (saved) {
      setSettings(prev => ({ ...prev, theme: saved as ThemeMode }));
      applyTheme(saved as ThemeMode);
    } else if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.theme) {
        setSettings(prev => ({ ...prev, theme: parsed.theme }));
        applyTheme(parsed.theme);
      }
    }
  }, []);

  const handleThemeChange = (theme: ThemeMode) => {
    setSettings({ ...settings, theme });
    applyTheme(theme);
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Save to backend via API
      await api("/user/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      
      // Also save to localStorage as fallback
      localStorage.setItem("user-settings", JSON.stringify(settings));
      
      // Apply theme immediately
      applyTheme(settings.theme);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err: any) {
      // Still save locally if API fails (for demo purposes)
      localStorage.setItem("user-settings", JSON.stringify(settings));
      applyTheme(settings.theme);
      setMessage({ type: "success", text: "Settings saved locally!" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    setShowSignoutDialog(false);
    logout();
    navigate("/login");
  };

  const applyTheme = (theme: ThemeMode) => {
    const html = document.documentElement;
    
    // Remove dark class first
    html.classList.remove("dark");
    
    if (theme === "dark") {
      html.classList.add("dark");
    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark");
      }
    }
    // 'light' means no dark class
  };

  useEffect(() => {
    // Apply saved theme on mount
    applyTheme(settings.theme);
  }, []);

  const handleResetSettings = () => {
    const defaults: SettingsData = {
      theme: "light",
      notifications: "all",
      emailNotifications: true,
      voteReminders: true,
      resultsAlerts: true,
      language: "en",
      timezone: "EAT",
    };
    setSettings(defaults);
    setShowResetDialog(false);
    applyTheme("light");
    localStorage.removeItem("user-settings");
    setMessage({ type: "success", text: "Settings reset to defaults" });
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="text-slate-500 text-sm">Customize your experience</p>
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

      {/* Appearance Settings */}
      <div className="card animate-enter stagger-2">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Appearance
        </h3>
        <div className="space-y-4">
          {/* Theme Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Theme Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: "☀️" },
                { value: "dark", label: "Dark", icon: "🌙" },
                { value: "system", label: "System", icon: "🖥️" },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value as ThemeMode)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    settings.theme === option.value
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium text-slate-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="input w-full"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="input w-full"
            >
              <option value="EAT">East Africa Time (EAT) - UTC+3</option>
              <option value="WAT">West Africa Time (WAT) - UTC+1</option>
              <option value="CAT">Central Africa Time (CAT) - UTC+2</option>
              <option value="GMT">Greenwich Mean Time (GMT) - UTC+0</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
              <option value="EST">Eastern Standard Time (EST) - UTC-5</option>
              <option value="PST">Pacific Standard Time (PST) - UTC-8</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card animate-enter stagger-3">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </h3>
        <div className="space-y-4">
          {/* Notification Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Notification Frequency</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "all", label: "All Notifications", desc: "Get notified about everything" },
                { value: "important", label: "Important Only", desc: "Only critical updates" },
                { value: "none", label: "Mute All", desc: "Silence all notifications" },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, notifications: option.value as NotificationPref })}
                  className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    settings.notifications === option.value
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold text-slate-900 text-sm">{option.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle switches */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-500">Receive updates via email</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailNotifications ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.emailNotifications ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Vote Reminders</p>
                <p className="text-sm text-slate-500">Get reminded before elections close</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, voteReminders: !settings.voteReminders })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.voteReminders ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.voteReminders ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Results Alerts</p>
                <p className="text-sm text-slate-500">Notify when results are published</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, resultsAlerts: !settings.resultsAlerts })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.resultsAlerts ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.resultsAlerts ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="card animate-enter stagger-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Privacy & Data
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Download My Data</p>
              <p className="text-sm text-slate-500">Export all your personal data</p>
            </div>
            <button className="btn-secondary btn-sm">Download</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Voting History</p>
              <p className="text-sm text-slate-500">View your past voting records</p>
            </div>
            <button className="btn-secondary btn-sm">View History</button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Active Sessions</p>
              <p className="text-sm text-slate-500">See where you're logged in</p>
            </div>
            <button className="btn-secondary btn-sm">Manage</button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card animate-enter stagger-5 space-y-3">
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
            onClick={() => setShowSignoutDialog(true)}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="text-4xl mb-4 text-center">⚠️</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Reset Settings?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will restore all settings to their default values. This action cannot be undone.
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

      {/* Sign Out Confirmation Dialog */}
      {showSignoutDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowSignoutDialog(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
            <div className="text-4xl mb-4 text-center">👋</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Sign Out?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignoutDialog(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="btn-ghost text-red-600 hover:bg-red-50 border border-red-200 flex-1"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
