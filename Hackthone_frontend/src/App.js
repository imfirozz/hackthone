import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import FlexibleDashboard from "./Components/FlexibleDashboard";
import Home from "./Components/Home";
import PlaceholderPage from "./Components/PlaceholderPage";
import Mock from "./Components/Mock";
import Technical from "./Components/Technical";
import HR from "./Components/HR";
import InterviewsHub from "./Components/InterviewsHub";
import Analytics from "./Components/Analytics";
import Pricing from "./Components/Pricing";
import Login from "./Components/login/login.js";
import Register from "./Components/login/Register.js";
import Verification from "./Components/login/Verification.js";
import LeaderboardPage from "./Components/LeaderboardPage";
import CandidatesPage from "./Components/CandidatesPage";
import InterviewSession from "./Components/InterviewSession";
import SettingsPage from "./Components/SettingsPage";
import ChatBotIcon from "./Components/ChatBotIcon";
import { BRAND_LOGO_URL } from "./brandAssets";

import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Disable smooth scrolling temporarily for instant snap to top
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    // Restore smooth scrolling if needed by other components
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = "smooth";
    }, 0);
  }, [pathname]);

  return null;
}

function AppBackground({ showSpline = true }) {
  const splineRef = React.useRef(null);

  React.useEffect(() => {
    if (!showSpline) {
      return undefined;
    }

    const container = splineRef.current;
    if (!container) return;

    container.innerHTML = "";
    const viewer = document.createElement("spline-viewer");
    viewer.setAttribute("url", "https://prod.spline.design/Binwrg6ftdMIcBpw/scene.splinecode");
    viewer.style.cssText = "display:block;width:100%;height:100%;";
    container.appendChild(viewer);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="app-background" aria-hidden="true">
      {showSpline ? (
        <>
          <div className="app-spline-wrap">
            <div className="app-spline-viewer" ref={splineRef} />
          </div>
          <div className="app-spline-badge-mask" />
        </>
      ) : null}
    </div>
  );
}

function RouteSkeletonOverlay() {
  const { pathname } = useLocation();
  const [visible, setVisible] = React.useState(false);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);
    const timeoutId = window.setTimeout(() => setVisible(false), 420);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <div
      className={`route-skeleton-overlay ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="route-skeleton-shell">
        <div className="route-skeleton-sidebar">
          <div className="route-skeleton-line route-skeleton-logo"></div>
          <div className="route-skeleton-line route-skeleton-menu"></div>
          <div className="route-skeleton-line route-skeleton-menu"></div>
          <div className="route-skeleton-line route-skeleton-menu"></div>
          <div className="route-skeleton-line route-skeleton-menu"></div>
          <div className="route-skeleton-line route-skeleton-menu"></div>
        </div>
        <div className="route-skeleton-main">
          <div className="route-skeleton-row top">
            <div className="route-skeleton-block tall"></div>
            <div className="route-skeleton-block"></div>
            <div className="route-skeleton-block"></div>
          </div>
          <div className="route-skeleton-row bottom">
            <div className="route-skeleton-block"></div>
            <div className="route-skeleton-block"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppFrame() {
  const { pathname } = useLocation();
  const hideHomeRobot = pathname === "/" || pathname === "/home";

  return (
    <div className="app-shell site-theme">
      <AppBackground showSpline={!hideHomeRobot} />
      <div className="app-content">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dashboard" element={<FlexibleDashboard />} />
          <Route path="/interviews" element={<InterviewsHub />} />
          <Route path="/mock" element={<Mock />} />
          <Route path="/technical" element={<Technical />} />
          <Route path="/hr-interview" element={<HR />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verification" element={<Verification />} />
          <Route
            path="/start"
            element={<Navigate to="/interviews" replace />}
          />
          <Route
            path="/session"
            element={<InterviewSession />}
          />
          <Route
            path="/mock-session"
            element={<InterviewSession mode="mock" />}
          />
          <Route
            path="/technical-session"
            element={<InterviewSession mode="technical" />}
          />
          <Route path="/hr-session" element={<InterviewSession mode="hr" />} />
          <Route
            path="/candidates"
            element={<CandidatesPage />}
          />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/feature/smart-feedback"
            element={
              <PlaceholderPage
                title="Smart Feedback"
                description="AI generated smart feedback for your next round."
              />
            }
          />
          <Route
            path="/feature/restructure"
            element={
              <PlaceholderPage
                title="Restructure Answers"
                description="Turn raw answers into high-signal interview responses."
              />
            }
          />
          <Route
            path="/feature/revisit"
            element={
              <PlaceholderPage
                title="Revisit Sessions"
                description="Revisit previous interviews with AI feedback."
              />
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <ChatBotIcon />
      <RouteSkeletonOverlay />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red" }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppFrame />
      </HashRouter>
    </ErrorBoundary>
  );
}

const brandLogoMarkup = `
  <img
    src="${BRAND_LOGO_URL}"
    alt="Blackhole logo"
    class="brand-logo-image brand-logo-image--loading"
    referrerpolicy="no-referrer"
    draggable="false"
  />
`;

function renderFatalError(error) {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const stack = error instanceof Error && error.stack ? error.stack : "";

  rootElement.innerHTML = `
    <div style="min-height:100vh;padding:24px;font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;background:#020617;color:#e2e8f0;">
      <div style="max-width:960px;margin:0 auto;background:linear-gradient(180deg, rgba(15,23,42,0.86), rgba(15,23,42,0.62));border:1px solid rgba(148,163,184,0.24);border-radius:24px;padding:24px;box-shadow:0 24px 80px rgba(2,6,23,0.42);backdrop-filter:blur(20px);">
        <div style="display:flex;align-items:center;gap:16px;margin:0 0 12px;">
          ${brandLogoMarkup}
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#f8fafc;">Interview workspace failed to load</h1>
        </div>
        <p style="margin:0 0 16px;color:#94a3b8;">A startup error blocked the app from rendering. The details below should make the failure visible instead of leaving a blank page.</p>
        <pre style="margin:0;white-space:pre-wrap;word-break:break-word;background:#020814;color:#e2e8f0;padding:16px;border-radius:16px;overflow:auto;border:1px solid rgba(148,163,184,0.18);">${`${message}\n\n${stack}`.trim()}</pre>
      </div>
    </div>
  `;
}

function isSplineFetchFailure(reason) {
  const reasonMessage =
    typeof reason?.message === "string" ? reason.message : "";
  const reasonStack = typeof reason?.stack === "string" ? reason.stack : "";

  return (
    reasonMessage.includes("Failed to fetch") ||
    reasonStack.includes("spline-viewer.js")
  );
}

const runtimeErrorHandlerKey = "__AIX_RUNTIME_ERROR_HANDLER__";
const runtimeRejectionHandlerKey = "__AIX_RUNTIME_REJECTION_HANDLER__";
const reactRootKey = "__AIX_REACT_ROOT__";

if (window[runtimeErrorHandlerKey]) {
  window.removeEventListener("error", window[runtimeErrorHandlerKey]);
}

if (window[runtimeRejectionHandlerKey]) {
  window.removeEventListener(
    "unhandledrejection",
    window[runtimeRejectionHandlerKey],
  );
}

const runtimeErrorHandler = (event) => {
  if (event.error) {
    renderFatalError(event.error);
  }
};

const runtimeRejectionHandler = (event) => {
  if (event.defaultPrevented || isSplineFetchFailure(event.reason)) {
    if (isSplineFetchFailure(event.reason)) {
      event.preventDefault();
    }
    return;
  }

  renderFatalError(
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason)),
  );
};

window[runtimeErrorHandlerKey] = runtimeErrorHandler;
window[runtimeRejectionHandlerKey] = runtimeRejectionHandler;

window.addEventListener("error", runtimeErrorHandler);
window.addEventListener("unhandledrejection", runtimeRejectionHandler);

const rootElement = document.getElementById("root");
const existingRoot = window[reactRootKey];

if (rootElement && !existingRoot) {
  rootElement.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;background:#020617;color:#e2e8f0;">
      <div style="text-align:center;padding:28px 32px;border-radius:28px;border:1px solid rgba(148,163,184,0.22);background:linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.52));box-shadow:0 24px 80px rgba(2,6,23,0.42);backdrop-filter:blur(18px);">
        <div style="display:flex;justify-content:center;">${brandLogoMarkup}</div>
        <div style="margin-top:8px;color:#94a3b8;">Loading interview workspace...</div>
      </div>
    </div>
  `;
}

try {
  if (!rootElement) {
    throw new Error("Root element not found.");
  }

  const appRoot = existingRoot || ReactDOM.createRoot(rootElement);
  window[reactRootKey] = appRoot;
  appRoot.render(<App />);
} catch (error) {
  renderFatalError(error);
}
