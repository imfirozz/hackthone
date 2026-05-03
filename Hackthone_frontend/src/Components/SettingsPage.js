import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";
import {
  fetchCurrentUser,
  getDefaultUserPreferences,
  getStoredAuthSession,
  requestPasswordReset,
  updateCurrentUserProfile,
} from "../services/authApi";

function InfoCard({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      {note ? <p className="mt-1 text-sm text-slate-500">{note}</p> : null}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <span className="relative mt-1 inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-sky-500" />
        <span className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

const EMPTY_USER = {
  firstName: "",
  lastName: "",
  email: "",
  role: "user",
  avatarUrl: "",
  authProvider: "local",
  createdAt: "",
  updatedAt: "",
  preferences: getDefaultUserPreferences(),
};

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(EMPTY_USER);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
    preferences: getDefaultUserPreferences(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const syncUserState = (nextUser) => {
    const normalizedUser = {
      ...EMPTY_USER,
      ...nextUser,
      preferences: getDefaultUserPreferences(nextUser),
    };

    setUser(normalizedUser);
    setForm({
      firstName: normalizedUser.firstName || "",
      lastName: normalizedUser.lastName || "",
      avatarUrl: normalizedUser.avatarUrl || "",
      preferences: normalizedUser.preferences,
    });
  };

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const session = getStoredAuthSession();

        if (!session?.token) {
          navigate("/login");
          return;
        }

        const currentUser = await fetchCurrentUser(session.token);
        syncUserState(currentUser);
      } catch (error) {
        setLoadError(error.message || "Failed to load user settings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const headerActions = (
    <button
      type="button"
      disabled={isSaving}
      onClick={async () => {
        setIsSaving(true);
        setSaveMessage("");
        setLoadError("");

        try {
          const updatedUser = await updateCurrentUserProfile(form);
          syncUserState(updatedUser);
          setSaveMessage("Settings saved successfully.");
        } catch (error) {
          setLoadError(error.message || "Failed to save settings.");
        } finally {
          setIsSaving(false);
        }
      }}
      className="liquid-glass-chip rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? "Saving..." : "Save Changes"}
    </button>
  );

  const avatarPreview = useMemo(() => {
    if (form.avatarUrl) {
      return form.avatarUrl;
    }

    return user.avatarUrl || "";
  }, [form.avatarUrl, user.avatarUrl]);

  return (
    <DashboardLayout
      projectName="AIX"
      projectSubtitle="Interview AI"
      navItems={navItems}
      aiShortcuts={aiShortcuts}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight text-white">
              Settings
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage your profile, interview defaults, and notification preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoadError("");
              setSaveMessage("");
              syncUserState(user);
            }}
            className="liquid-glass-chip rounded-2xl px-4 py-3 text-sm font-medium text-slate-100"
          >
            Reset Changes
          </button>
        </div>

        {loadError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading settings...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Account Role"
                value={(user.role || "user").replace(/\b\w/g, (char) => char.toUpperCase())}
                note="Used for dashboard access and permissions"
              />
              <InfoCard
                label="Auth Provider"
                value={(user.authProvider || "local").replace(/\b\w/g, (char) => char.toUpperCase())}
                note="Current login method"
              />
              <InfoCard
                label="Joined"
                value={formatDate(user.createdAt)}
                note="Account created date"
              />
              <InfoCard
                label="Updated"
                value={formatDate(user.updatedAt)}
                note="Last profile change"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900">Profile</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Update the identity that appears across the dashboard and leaderboards.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">First Name</span>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, firstName: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Last Name</span>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, lastName: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Email Address</span>
                      <input
                        type="email"
                        value={user.email || ""}
                        readOnly
                        className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Avatar URL</span>
                      <input
                        type="url"
                        value={form.avatarUrl}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, avatarUrl: event.target.value }))
                        }
                        placeholder="https://example.com/avatar.png"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900">Interview Preferences</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Control how the platform should default your interview flow.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Default Role Filter</span>
                      <select
                        value={form.preferences.defaultRoleFilter}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            preferences: {
                              ...current.preferences,
                              defaultRoleFilter: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      >
                        <option value="All Roles">All Roles</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Java Developer">Java Developer</option>
                        <option value="Python Developer">Python Developer</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Preferred Interview Mode</span>
                      <select
                        value={form.preferences.preferredInterviewMode}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            preferences: {
                              ...current.preferences,
                              preferredInterviewMode: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      >
                        <option value="text">Text</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="voice">Voice</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose which reminders and coaching nudges you want to keep.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <ToggleRow
                      label="Email reminders"
                      description="Receive reminders to finish incomplete interview sessions."
                      checked={form.preferences.emailReminders}
                      onChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          preferences: { ...current.preferences, emailReminders: checked },
                        }))
                      }
                    />
                    <ToggleRow
                      label="Weekly digest"
                      description="Get one weekly summary of performance, trends, and completed sessions."
                      checked={form.preferences.weeklyDigest}
                      onChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          preferences: { ...current.preferences, weeklyDigest: checked },
                        }))
                      }
                    />
                    <ToggleRow
                      label="Product tips"
                      description="Show workflow tips, AI coaching hints, and feature highlights."
                      checked={form.preferences.productTips}
                      onChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          preferences: { ...current.preferences, productTips: checked },
                        }))
                      }
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Preview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This is how your profile appears in the dashboard.
                  </p>

                  <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
                    <div className="flex items-center gap-4">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile avatar"
                          className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/50 via-cyan-500/30 to-emerald-400/30 text-lg font-bold">
                          {(form.firstName?.[0] || user.firstName?.[0] || "U").toUpperCase()}
                          {(form.lastName?.[0] || user.lastName?.[0] || "").toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-bold">
                          {[form.firstName, form.lastName].filter(Boolean).join(" ") || "User"}
                        </p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Security</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage authentication actions for this account.
                  </p>

                  <div className="mt-5 space-y-4 rounded-2xl bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Sign-in Method</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {user.authProvider === "google"
                          ? "This account signs in with Google."
                          : "This account signs in with email and password."}
                      </p>
                    </div>

                    {user.authProvider === "local" ? (
                      <button
                        type="button"
                        disabled={isSendingReset || !user.email}
                        onClick={async () => {
                          setIsSendingReset(true);
                          setLoadError("");
                          setSaveMessage("");
                          try {
                            const response = await requestPasswordReset(user.email);
                            setSaveMessage(
                              response.resetUrl
                                ? `Password reset link generated. ${response.resetUrl}`
                                : "Password reset link generated successfully.",
                            );
                          } catch (error) {
                            setLoadError(error.message || "Failed to create reset link.");
                          } finally {
                            setIsSendingReset(false);
                          }
                        }}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSendingReset ? "Generating Reset Link..." : "Send Password Reset Link"}
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Password management is handled by your Google account.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
