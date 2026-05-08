import { useEffect, useState } from "react";
import {
  SparkIcon,
  FeedbackIcon,
  ArrowRightIcon,
  SearchIcon,
  BellIcon,
  LogoutIcon,
} from "./Icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AUTH_EXPIRED_EVENT,
  AUTH_SESSION_UPDATED_EVENT,
  getAuthIdentity,
  logoutUser,
} from "../../services/authApi";

export default function DashboardLayout({
  projectName = "AIX",
  projectSubtitle = "Interview AI",
  navItems = [],
  activeNav,
  setActiveNav,
  aiShortcuts = [],
  headerActions = null,
  children,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [authIdentity, setAuthIdentity] = useState(() => getAuthIdentity());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncAuthIdentity = () => {
      setAuthIdentity(getAuthIdentity());
    };
    const handleAuthExpired = () => {
      setAuthIdentity(null);
      navigate("/login");
    };

    window.addEventListener("storage", syncAuthIdentity);
    window.addEventListener("focus", syncAuthIdentity);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthIdentity);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener("storage", syncAuthIdentity);
      window.removeEventListener("focus", syncAuthIdentity);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuthIdentity);
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [navigate]);

  const displayName = authIdentity?.displayName || "Guest";
  const displayRole = authIdentity?.roleLabel || "Not signed in";
  const displayInitials = authIdentity?.initials || "G";

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthIdentity(null);
      setIsLoggingOut(false);
      navigate("/login");
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="dashboard-shell min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="liquid-glass-panel mx-auto w-full max-w-480 overflow-hidden rounded-[38px]">
        <div className={`lg:grid ${sidebarCollapsed ? 'lg:grid-cols-[100px_minmax(0,1fr)]' : 'lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]'} transition-[grid-template-columns] duration-500 ease-in-out`}>
          {/* Sidebar */}
          <aside className="flex min-h-full flex-col border-r border-white/10 bg-transparent overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center py-8' : 'justify-between px-6 py-8'} border-b border-white/10 transition-all duration-500 min-h-[108px]`}>
              {!sidebarCollapsed ? (
                <>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <div>
                      <p className="text-[30px] font-bold tracking-tight text-white leading-none">
                        {projectName}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mt-1">
                        {projectSubtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    className="liquid-glass-chip rounded-xl p-2 text-slate-300 transition-all flex-shrink-0"
                    title="Collapse Sidebar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="liquid-glass-chip rounded-xl p-3 text-slate-200 transition-all"
                  title="Expand Sidebar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>

            <nav className={`py-8 ${sidebarCollapsed ? 'px-4' : 'px-5'} transition-all duration-500`}>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  // Determine active state based on current URL path
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => navigate(item.path)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex w-full items-center ${sidebarCollapsed ? 'justify-center p-3' : 'gap-4 px-5 py-4'} rounded-2xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "liquid-glass-button text-white"
                          : "text-slate-300 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon className="h-6 w-6 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </nav>

            {!sidebarCollapsed && (
              <div className="border-t border-white/10 px-5 py-6 whitespace-nowrap animate-in fade-in duration-500">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    AI Shortcuts
                  </p>
                  <SparkIcon className="h-4 w-4 text-sky-600" />
                </div>

                <div className="space-y-3">
                  {aiShortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="liquid-glass-card group block w-full rounded-2xl p-4 text-left transition hover:border-sky-300/40 hover:-translate-y-0.5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="liquid-glass-chip flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition">
                            <Icon className="h-5 w-5 text-slate-100 transition group-hover:text-sky-300" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white transition group-hover:text-sky-200 truncate">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-400 truncate">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`mt-auto pb-6 ${sidebarCollapsed ? 'px-4' : 'px-5'} transition-all duration-500`}>
              <button
                type="button"
                onClick={() => alert("Leave Feedback Clicked")}
                title={sidebarCollapsed ? "Leave Feedback" : undefined}
                className={`liquid-glass-chip flex w-full items-center ${sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-2xl text-sm font-semibold text-slate-200 transition hover:text-sky-200 whitespace-nowrap`}
              >
                <span className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                  <FeedbackIcon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && "Leave Feedback"}
                </span>
                {!sidebarCollapsed && <ArrowRightIcon className="h-4 w-4 flex-shrink-0" />}
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <main className="min-w-0 bg-transparent flex flex-col h-full overflow-hidden">
            {/* Top Navigation */}
            <div className="border-b border-white/10 bg-transparent px-6 py-5 lg:px-10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <label className="liquid-glass-input flex w-full max-w-105 items-center gap-3 rounded-2xl px-4 py-3">
                  <SearchIcon className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {headerActions}

                  <button
                    type="button"
                    className="liquid-glass-chip rounded-2xl p-3 text-slate-300"
                    onClick={() => alert("Notifications Clicked")}
                  >
                    <BellIcon className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="liquid-glass-chip inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogoutIcon className="h-5 w-5" />
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>

                  <div
                    className="liquid-glass-chip flex items-center gap-3 rounded-2xl px-2 py-1.5"
                    title={authIdentity?.email || displayName}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-sky-400/45 via-cyan-300/25 to-emerald-300/20 text-sm font-bold tracking-[0.24em] text-white ring-1 ring-white/12">
                      {displayInitials}
                    </div>
                    <div className="pr-2">
                      <p className="max-w-36 truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-400">{displayRole}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="dashboard-contrast px-6 py-6 lg:px-10 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
