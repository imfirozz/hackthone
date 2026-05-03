import { Link, useNavigate } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";
import { useEffect, useState } from "react";
import { BRAND_LOGO_URL } from "../brandAssets";
import { getAuthIdentity, logoutUser } from "../services/authApi";

const navItems = ["Home", "Features", "Pricing", "Dashboard", "About"];
const headerStars = [
  { top: "7%", left: "6%", size: 2.2, delay: "0.2s", duration: "4.8s", opacity: 0.72 },
  { top: "10%", left: "18%", size: 1.8, delay: "1.4s", duration: "6.1s", opacity: 0.8 },
  { top: "8%", left: "33%", size: 2.4, delay: "0.9s", duration: "5.3s", opacity: 0.88 },
  { top: "14%", left: "47%", size: 1.6, delay: "2.2s", duration: "4.9s", opacity: 0.7 },
  { top: "11%", left: "61%", size: 2, delay: "0.4s", duration: "5.7s", opacity: 0.82 },
  { top: "9%", left: "75%", size: 2.8, delay: "1.8s", duration: "6.4s", opacity: 0.92 },
  { top: "15%", left: "88%", size: 1.8, delay: "2.6s", duration: "5.5s", opacity: 0.74 },
  { top: "23%", left: "10%", size: 1.6, delay: "1.1s", duration: "4.6s", opacity: 0.68 },
  { top: "27%", left: "24%", size: 2.5, delay: "2.8s", duration: "5.9s", opacity: 0.9 },
  { top: "31%", left: "40%", size: 1.7, delay: "0.7s", duration: "4.4s", opacity: 0.72 },
  { top: "26%", left: "57%", size: 2.1, delay: "1.9s", duration: "5.6s", opacity: 0.84 },
  { top: "34%", left: "72%", size: 1.9, delay: "0.5s", duration: "6.2s", opacity: 0.76 },
  { top: "29%", left: "91%", size: 2.6, delay: "2.4s", duration: "5.1s", opacity: 0.92 },
  { top: "43%", left: "5%", size: 1.8, delay: "1.7s", duration: "5.2s", opacity: 0.75 },
  { top: "48%", left: "19%", size: 2.2, delay: "0.1s", duration: "4.7s", opacity: 0.82 },
  { top: "54%", left: "36%", size: 1.5, delay: "2.1s", duration: "6.3s", opacity: 0.66 },
  { top: "46%", left: "63%", size: 2.4, delay: "1.3s", duration: "5.4s", opacity: 0.88 },
  { top: "51%", left: "81%", size: 1.8, delay: "2.9s", duration: "4.8s", opacity: 0.72 },
  { top: "61%", left: "12%", size: 2.5, delay: "0.8s", duration: "5.8s", opacity: 0.86 },
  { top: "67%", left: "29%", size: 1.7, delay: "2.5s", duration: "6.1s", opacity: 0.7 },
  { top: "72%", left: "51%", size: 2.1, delay: "1.2s", duration: "4.9s", opacity: 0.8 },
  { top: "66%", left: "70%", size: 1.9, delay: "0.3s", duration: "5.6s", opacity: 0.76 },
  { top: "74%", left: "86%", size: 2.7, delay: "2.7s", duration: "6.4s", opacity: 0.9 },
  { top: "84%", left: "8%", size: 1.8, delay: "1.6s", duration: "4.6s", opacity: 0.72 },
  { top: "88%", left: "22%", size: 2.2, delay: "0.6s", duration: "5.3s", opacity: 0.84 },
  { top: "82%", left: "44%", size: 1.5, delay: "2.3s", duration: "6s", opacity: 0.64 },
  { top: "90%", left: "59%", size: 2.6, delay: "1s", duration: "5s", opacity: 0.9 },
  { top: "86%", left: "76%", size: 1.7, delay: "2s", duration: "6.1s", opacity: 0.7 },
  { top: "91%", left: "92%", size: 2.3, delay: "0.5s", duration: "4.7s", opacity: 0.82 },
];

function BrandLogo({ compact = false }) {
  return (
    <span className={`brand-mark${compact ? " brand-mark--compact" : ""}`}>
      <img
        src={BRAND_LOGO_URL}
        alt="Blackhole logo"
        className="brand-logo-image"
        referrerPolicy="no-referrer"
        draggable="false"
      />
      <span className="brand-wordmark-shell" aria-hidden="true">
        <span className="brand-wordmark">Neura</span>
      </span>
    </span>
  );
}

function handleLandingNav(item, event) {
  if (item === "Features") {
    event.preventDefault();
    const scrollToFeatures = () =>
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });

    if (window.location.hash !== "#/" && window.location.hash !== "#/home") {
      window.location.hash = "/home";
      window.setTimeout(scrollToFeatures, 180);
      return;
    }

    scrollToFeatures();
    return;
  }

  if (item === "Home") {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function HeaderNavigation({
  isScrolled = false,
  authIdentity = null,
  isLoggingOut = false,
  onLogout = null,
}) {
  return (
    <div className="premium-body-font pointer-events-none fixed top-0 left-0 right-0 z-[80] px-4 py-4 sm:px-6 lg:px-8">
      <div
        className="liquid-glass-nav pointer-events-auto relative mx-auto hidden items-center overflow-hidden rounded-full px-5 py-3 md:flex"
        style={{
          maxWidth: isScrolled ? "860px" : "1280px",
          transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-full w-1/3 bg-linear-to-r from-transparent via-white/12 to-transparent blur-xl" />
        </div>

        <div
          style={{
            maxWidth: isScrolled ? "0px" : "188px",
            opacity: isScrolled ? 0 : 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginRight: isScrolled ? "0px" : "12px",
            transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="brand-mark-link inline-flex items-center text-white"
          >
            <BrandLogo />
          </Link>
        </div>

        <nav className="relative z-10 flex flex-1 items-center justify-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item}
              to={item === "Home" ? "/" : item === "Features" ? "/home" : `/${item.toLowerCase()}`}
              onClick={(event) => handleLandingNav(item, event)}
              className="premium-nav-text liquid-glass-chip landing-nav-tab rounded-full px-4 py-2 text-sm font-semibold text-slate-100 transition-all duration-300 hover:text-white"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div
          style={{
            maxWidth: isScrolled ? "0px" : "220px",
            opacity: isScrolled ? 0 : 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginLeft: isScrolled ? "0px" : "12px",
            transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {authIdentity ? (
            <div className="flex items-center gap-2">
              <Link
                to="/interviews"
                onClick={() => window.scrollTo(0, 0)}
                className="liquid-glass-chip inline-flex items-center gap-3 rounded-full px-2 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5"
                title={authIdentity.email || authIdentity.displayName}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-sky-400/45 via-cyan-300/25 to-emerald-300/20 text-xs font-bold tracking-[0.24em] text-white ring-1 ring-white/12">
                  {authIdentity.initials}
                </span>
                <span className="pr-3 text-left leading-tight">
                  <span className="block max-w-[132px] truncate text-sm font-semibold text-white">
                    {authIdentity.displayName}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-300">
                    {authIdentity.roleLabel}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="premium-nav-text liquid-glass-button inline-flex rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => window.scrollTo(0, 0)}
              className="premium-nav-text liquid-glass-button inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              Login / SignUp
            </Link>
          )}
        </div>
      </div>

      <div className="pointer-events-auto flex items-center justify-between gap-3 md:hidden">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="brand-mark-link inline-flex items-center text-white"
        >
          <BrandLogo compact />
        </Link>
        {authIdentity ? (
          <div className="flex items-center gap-2">
            <Link
              to="/interviews"
              onClick={() => window.scrollTo(0, 0)}
              className="liquid-glass-chip inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-white"
              title={authIdentity.email || authIdentity.displayName}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-sky-400/45 via-cyan-300/25 to-emerald-300/20 text-[11px] font-bold tracking-[0.2em] text-white ring-1 ring-white/12">
                {authIdentity.initials}
              </span>
              <span className="max-w-[94px] truncate pr-2 text-sm font-semibold">
                {authIdentity.displayName}
              </span>
            </Link>
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="premium-nav-text liquid-glass-button inline-flex rounded-full px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "..." : "Out"}
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={() => window.scrollTo(0, 0)}
            className="premium-nav-text liquid-glass-button inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  return <HeaderNavigation />;
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [authIdentity, setAuthIdentity] = useState(() => getAuthIdentity());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncAuthIdentity = () => {
      setAuthIdentity(getAuthIdentity());
    };

    window.addEventListener("storage", syncAuthIdentity);
    window.addEventListener("focus", syncAuthIdentity);

    return () => {
      window.removeEventListener("storage", syncAuthIdentity);
      window.removeEventListener("focus", syncAuthIdentity);
    };
  }, []);

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
    <header className="premium-body-font relative min-h-screen overflow-hidden">
      <HeaderNavigation
        isScrolled={isScrolled}
        authIdentity={authIdentity}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />
      <div className="header-starfield" aria-hidden="true">
        {headerStars.map((star, index) => (
          <span
            key={index}
            className="header-star"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl items-center px-6 pb-18 pt-30 md:px-8 lg:pb-24 lg:pt-36">
        <div className="flex min-h-[58vh] w-full max-w-4xl flex-col justify-center sm:min-h-[62vh] lg:min-h-[68vh]">
          <h2
            className="premium-heading-font mt-6 flex flex-col gap-3 text-5xl font-normal leading-[0.96] text-white lg:gap-4 lg:text-7xl"
            style={{
              textShadow: "0 18px 48px rgba(2, 6, 23, 0.72)",
            }}
          >
            <span className="block">Master your</span>
            <span className="block min-h-[1.2em] bg-linear-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">
              <Typewriter
                words={[
                  "Frontend Developer",
                  "Backend Developer",
                  "Full Stack",
                  "Java Developer",
                  "Python Developer",
                ]}
                loop={true}
                cursor
                cursorStyle="|"
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={1500}
              />
            </span>
            <span
              className="block leading-[1.08] tracking-[0.01em] text-slate-100"
              style={{ wordSpacing: "0.14em" }}
            >
              Interview with AI
            </span>
          </h2>

          <div className="mt-6 flex flex-wrap gap-4 pt-1 sm:pt-3">
            <Link
              to="/mock"
              className="fancy-glow-btn"
            >
              Get Started
            </Link>

            <Link
              to="/interviews"
              className="liquid-glass-chip inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold text-slate-100 transition-all duration-300 hover:-translate-y-1"
            >
              Explore all tracks
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

export function Layout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
