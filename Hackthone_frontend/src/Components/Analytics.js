import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts, skillMeta } from "./dashboard/data";
import { buildRoleReadiness, roleStyles } from "./dashboard/utils";
import {
  StatsIcon, TrendUpIcon, TrendDownIcon, AdjustmentsIcon, ChevronDownIcon, RefreshIcon,
} from "./dashboard/Icons";
import { fetchInterviewRecords } from "../services/recordsApi";

// ── helpers ──────────────────────────────────────────────────────────────────

const periods = ["Last 7 days", "Last 30 days", "Last 90 days", "All Time"];

function periodDays(period) {
  if (period === "Last 7 days") return 7;
  if (period === "Last 30 days") return 30;
  if (period === "Last 90 days") return 90;
  return null;
}

function cutoffDate(period) {
  const d = new Date();
  if (period === "Last 7 days") d.setDate(d.getDate() - 7);
  else if (period === "Last 30 days") d.setDate(d.getDate() - 30);
  else if (period === "Last 90 days") d.setDate(d.getDate() - 90);
  else d.setFullYear(2000);
  return d;
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

// score band colours (Tailwind safe-listed via inline style)
function scoreBand(score) {
  if (score >= 85) return { bg: "#d1fae5", text: "#065f46", label: "Strong" };
  if (score >= 70) return { bg: "#fef3c7", text: "#92400e", label: "On Track" };
  return { bg: "#fee2e2", text: "#991b1b", label: "Needs Work" };
}

function buildTrend(currentValue, previousValue) {
  if (previousValue === 0) return currentValue === 0 ? 0 : 100;
  const raw = Math.round(((currentValue - previousValue) / previousValue) * 100);
  return Math.max(-99, Math.min(99, raw));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function DetailHover({ details, children, className = "" }) {
  return (
    <div className={`group relative ${className}`}>
      {children}
      {details && (
        <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 w-72 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {details.title}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {details.items.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <p className="text-[10px] text-slate-400">{item.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{item.value}</p>
                  {item.note && <p className="mt-0.5 text-[10px] text-slate-400">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto h-3 w-3 rotate-45 border-b border-r border-white/10 bg-slate-900/95" />
        </div>
      )}
    </div>
  );
}

// ── tiny inline chart components ─────────────────────────────────────────────

function MiniBar({ value, max, color }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function RadialGauge({ value, size = 80, stroke = 8, color = "#6366f1" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function SparkLine({ points, w = 120, h = 40, color = "#6366f1" }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const area = `0,${h} ${coords} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VerticalBar({ value, max, color, label }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <span className="text-[10px] font-semibold text-slate-500">{value}</span>
      <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden" style={{ height: 64, background: "#f1f5f9" }}>
        <div
          className="w-full rounded-t-md transition-all duration-700"
          style={{ height: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-slate-400 text-center leading-3">{label}</span>
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  sparkPoints,
  color = "#6366f1",
  colorBg = "#eef2ff",
  trendDirection = "up",
  hoverDetails,
}) {
  const isPos = trendDirection === "down" ? trend <= 0 : trend >= 0;
  return (
    <div className="group relative">
      {hoverDetails && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-20 w-72 -translate-x-1/2 -translate-y-full opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-[calc(100%+8px)]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {hoverDetails.title}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {hoverDetails.items.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <p className="text-[10px] text-slate-400">{item.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{item.value}</p>
                  {item.note && <p className="mt-0.5 text-[10px] text-slate-400">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto h-3 w-3 rotate-45 border-b border-r border-white/10 bg-slate-900/95" />
        </div>
      )}
      <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: colorBg }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${isPos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {isPos ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-[28px] font-bold tracking-tight text-slate-900 leading-none">{value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        {sparkPoints && <SparkLine points={sparkPoints} color={color} />}
      </div>
    </div>
  );
}

// ── section wrapper ───────────────────────────────────────────────────────────

function Section({ title, sub, action, children }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-base font-bold text-slate-900">{title}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── main analytics page ───────────────────────────────────────────────────────

export default function Analytics() {
  const [interviewRecords, setInterviewRecords] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedPeriod, setSelectedPeriod] = useState("Last 30 days");
  const [roleOpen, setRoleOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const selectedPeriodDays = periodDays(selectedPeriod);
  const shouldShowTrend = selectedPeriod !== "All Time";

  const loadAnalyticsRecords = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetchInterviewRecords({ scope: "all" });
      setInterviewRecords(Array.isArray(response?.records) ? response.records : []);
    } catch (error) {
      setLoadError(error.message || "Failed to load analytics records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsRecords();
  }, []);

  const roleOptions = useMemo(
    () => [
      "All Roles",
      ...new Set(interviewRecords.map((record) => record.role).filter(Boolean)),
    ],
    [interviewRecords],
  );

  const filtered = useMemo(() => {
    const cutoff = cutoffDate(selectedPeriod);
    return interviewRecords.filter(r =>
      (selectedRole === "All Roles" || r.role === selectedRole) &&
      new Date(r.date) >= cutoff
    );
  }, [interviewRecords, selectedRole, selectedPeriod]);

  const previousFiltered = useMemo(() => {
    if (!selectedPeriodDays) return [];
    const currentCutoff = cutoffDate(selectedPeriod);
    const previousCutoff = new Date(currentCutoff);
    previousCutoff.setDate(previousCutoff.getDate() - selectedPeriodDays);

    return interviewRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        (selectedRole === "All Roles" || record.role === selectedRole) &&
        recordDate >= previousCutoff &&
        recordDate < currentCutoff
      );
    });
  }, [interviewRecords, selectedRole, selectedPeriod, selectedPeriodDays]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSessions = filtered.length;
  const avgScore = avg(filtered.map(r => r.score));
  const avgDuration = avg(filtered.map(r => r.duration));
  const strongHireCount = filtered.filter(r => r.score >= 85).length;
  const strongHireCandidates = new Set(
    filtered.filter((record) => record.score >= 85).map((record) => record.candidate)
  ).size;
  const strongHireRate = totalSessions ? Math.round((strongHireCount / totalSessions) * 100) : 0;
  const avgComm = avg(filtered.map(r => r.communication));
  const avgTech = avg(filtered.map(r => r.technical));
  const passCount = filtered.filter((record) => record.score >= 70).length;
  const passRate = totalSessions ? Math.round((passCount / totalSessions) * 100) : 0;
  const activeCandidates = new Set(filtered.map((record) => record.candidate)).size;

  const prevTotalSessions = previousFiltered.length;
  const prevAvgScore = avg(previousFiltered.map((record) => record.score));
  const prevAvgDuration = avg(previousFiltered.map((record) => record.duration));
  const prevStrongHireRate = prevTotalSessions
    ? Math.round((previousFiltered.filter((record) => record.score >= 85).length / prevTotalSessions) * 100)
    : 0;
  const prevAvgComm = avg(previousFiltered.map((record) => record.communication));
  const prevAvgTech = avg(previousFiltered.map((record) => record.technical));
  const prevPassRate = prevTotalSessions
    ? Math.round((previousFiltered.filter((record) => record.score >= 70).length / prevTotalSessions) * 100)
    : 0;
  const prevActiveCandidates = new Set(previousFiltered.map((record) => record.candidate)).size;

  const totalSessionsTrend = shouldShowTrend ? buildTrend(totalSessions, prevTotalSessions) : undefined;
  const avgScoreTrend = shouldShowTrend ? buildTrend(avgScore, prevAvgScore) : undefined;
  const strongHireTrend = shouldShowTrend ? buildTrend(strongHireRate, prevStrongHireRate) : undefined;
  const avgDurationTrend = shouldShowTrend ? buildTrend(avgDuration, prevAvgDuration) : undefined;
  const commTrend = shouldShowTrend ? buildTrend(avgComm, prevAvgComm) : undefined;
  const techTrend = shouldShowTrend ? buildTrend(avgTech, prevAvgTech) : undefined;
  const passRateTrend = shouldShowTrend ? buildTrend(passRate, prevPassRate) : undefined;
  const activeCandidatesTrend = shouldShowTrend ? buildTrend(activeCandidates, prevActiveCandidates) : undefined;

  // ── Sparkline data (score by week buckets) ─────────────────────────────────
  const weeklyScores = useMemo(() => {
    const buckets = {};
    filtered.forEach((record) => {
      const d = new Date(record.date);
      const day = d.getDay();
      const mondayOffset = (day + 6) % 7;
      d.setDate(d.getDate() - mondayOffset);
      d.setHours(0, 0, 0, 0);
      const week = d.toISOString().slice(0, 10);
      if (!buckets[week]) buckets[week] = [];
      buckets[week].push(record.score);
    });
    return Object.keys(buckets).sort().slice(-8).map((key) => avg(buckets[key]));
  }, [filtered]);

  // ── Role breakdown ─────────────────────────────────────────────────────────
  const roleBreakdown = useMemo(() => buildRoleReadiness(filtered), [filtered]);
  const roleMetrics = useMemo(() => {
    const grouped = {};
    filtered.forEach((record) => {
      if (!grouped[record.role]) {
        grouped[record.role] = { count: 0, strong: 0, best: 0 };
      }
      grouped[record.role].count += 1;
      grouped[record.role].strong += record.score >= 85 ? 1 : 0;
      grouped[record.role].best = Math.max(grouped[record.role].best, record.score);
    });
    return Object.fromEntries(
      Object.entries(grouped).map(([role, data]) => [
        role,
        {
          ...data,
          strongRate: data.count ? Math.round((data.strong / data.count) * 100) : 0,
        },
      ])
    );
  }, [filtered]);

  // ── Skill radar data ───────────────────────────────────────────────────────
  const skillAverages = useMemo(() =>
    skillMeta.map(s => ({
      ...s,
      value: avg(filtered.map(r => r[s.key])),
    })),
    [filtered]
  );
  const prevSkillMap = useMemo(
    () =>
      Object.fromEntries(
        skillMeta.map((skill) => [skill.key, avg(previousFiltered.map((record) => record[skill.key]))])
      ),
    [previousFiltered]
  );
  const rankedSkills = useMemo(
    () => [...skillAverages].sort((left, right) => right.value - left.value),
    [skillAverages]
  );
  const skillRankMap = useMemo(
    () => Object.fromEntries(rankedSkills.map((skill, index) => [skill.key, index + 1])),
    [rankedSkills]
  );
  const topSkill = rankedSkills[0] || { label: "-", value: 0 };

  // ── Round funnel ───────────────────────────────────────────────────────────
  const rounds = ["Mock Interview", "Technical Interview", "HR Interview", "Managerial Interview"];
  const roundStats = useMemo(() =>
    rounds.map(round => {
      const items = filtered.filter(r => r.round === round);
      const pass = items.filter((record) => record.score >= 70).length;
      return {
        label: round,
        count: items.length,
        avgScore: avg(items.map(r => r.score)),
        pass,
        review: Math.max(items.length - pass, 0),
        avgDuration: avg(items.map((record) => record.duration)),
        bestScore: items.length ? Math.max(...items.map((record) => record.score)) : 0,
        passRate: items.length ? Math.round((pass / items.length) * 100) : 0,
      };
    }),
    [filtered]
  );
  const roundMax = Math.max(...roundStats.map(r => r.count), 1);

  // ── Score distribution buckets ─────────────────────────────────────────────
  const scoreBuckets = useMemo(() => {
    const buckets = [
      { label: "50–59", min: 50, max: 59, color: "#f87171" },
      { label: "60–69", min: 60, max: 69, color: "#fb923c" },
      { label: "70–79", min: 70, max: 79, color: "#fbbf24" },
      { label: "80–89", min: 80, max: 89, color: "#34d399" },
      { label: "90–100", min: 90, max: 100, color: "#818cf8" },
    ];
    const computed = buckets.map((bucket) => {
      const inBand = filtered.filter((record) => record.score >= bucket.min && record.score <= bucket.max);
      return {
        ...bucket,
        count: inBand.length,
        avgScore: avg(inBand.map((record) => record.score)),
        passCount: inBand.filter((record) => record.score >= 70).length,
      };
    });
    const bMax = Math.max(...computed.map((bucket) => bucket.count), 1);
    return computed.map((bucket) => ({
      ...bucket,
      max: bMax,
      share: totalSessions ? Math.round((bucket.count / totalSessions) * 100) : 0,
    }));
  }, [filtered, totalSessions]);

  // ── Top candidate cards ────────────────────────────────────────────────────
  const topCandidates = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      if (!map[r.candidate]) {
        map[r.candidate] = {
          name: r.candidate,
          role: r.role,
          scores: [],
          firstDate: r.date,
          lastDate: r.date,
          firstScore: r.score,
          lastScore: r.score,
          bestScore: r.score,
          rounds: new Set(),
        };
      }
      if (new Date(r.date) < new Date(map[r.candidate].firstDate)) {
        map[r.candidate].firstDate = r.date;
        map[r.candidate].firstScore = r.score;
      }
      if (new Date(r.date) > new Date(map[r.candidate].lastDate)) {
        map[r.candidate].lastDate = r.date;
        map[r.candidate].lastScore = r.score;
      }
      map[r.candidate].bestScore = Math.max(map[r.candidate].bestScore, r.score);
      map[r.candidate].rounds.add(r.round);
      map[r.candidate].scores.push(r.score);
    });
    return Object.values(map)
      .map(c => ({
        ...c,
        avg: avg(c.scores),
        sessions: c.scores.length,
        roundsCount: c.rounds.size,
        trend: c.lastScore - c.firstScore,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6);
  }, [filtered]);

  const scoreBucketPeak = scoreBuckets.reduce((max, bucket) => (
    bucket.count > max.count ? bucket : max
  ), scoreBuckets[0] || { label: "-", count: 0 });

  const strongestRole = roleBreakdown[0] || { label: "-", score: 0 };
  const weakestRole = roleBreakdown[roleBreakdown.length - 1] || { label: "-", score: 0 };

  const avgPassingScore = passCount ? avg(filtered.filter((record) => record.score >= 70).map((record) => record.score)) : 0;
  const avgFailingScore = totalSessions - passCount
    ? avg(filtered.filter((record) => record.score < 70).map((record) => record.score))
    : 0;
  const sessionsPerCandidate = activeCandidates ? (totalSessions / activeCandidates).toFixed(1) : "0.0";

  const colorPalette = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

  const aiInsight = useMemo(() => {
    const strongestSkill = rankedSkills[0] || { label: "Communication", value: 0 };
    const weakestSkill = rankedSkills[rankedSkills.length - 1] || { label: "Delivery", value: 0 };
    const activeRounds = roundStats.filter((round) => round.count > 0);
    const bestRound = [...activeRounds].sort((left, right) => right.avgScore - left.avgScore)[0] || null;
    const weakestRound = [...activeRounds].sort((left, right) => left.avgScore - right.avgScore)[0] || null;
    const scoreGap = Math.max(strongestSkill.value - weakestSkill.value, 0);

    if (!totalSessions) {
      return {
        summary:
          "No interview evidence yet. Complete at least one evaluated session to unlock an AI-generated coaching report.",
        headline: "No insight available yet",
        readiness: "Not enough signal",
        strengths: [],
        risks: [
          "No completed interview answers are available to score communication, technical depth, or delivery.",
        ],
        actions: [
          "Complete one full interview with submitted answers.",
          "Use a technical round first so the report has stronger performance signals.",
          "Refresh Analytics after the first evaluated session is saved.",
        ],
      };
    }

    const readiness =
      avgScore >= 85
        ? "Strong hire signal"
        : avgScore >= 70
          ? "On-track but uneven"
          : "Coaching required";

    const summary =
      avgScore >= 85
        ? `Hiring signal is strong at ${avgScore}/100. ${strongestSkill.label} is leading, and ${bestRound?.label || "the top round"} is converting best.`
        : avgScore >= 70
          ? `Performance is usable at ${avgScore}/100, but ${weakestSkill.label} is holding the profile back. The biggest lift now is consistency across rounds.`
          : `Average score is ${avgScore}/100, which points to immediate coaching need. ${weakestSkill.label} and ${weakestRound?.label || "the weakest round"} are the first priorities.`;

    const strengths = [
      `${strongestSkill.label} is the current top dimension at ${strongestSkill.value}/100.`,
      bestRound
        ? `${bestRound.label} is performing best with an average of ${bestRound.avgScore}/100.`
        : "One round is not yet strong enough to stand out clearly.",
      strongHireRate
        ? `${strongHireRate}% of sessions are already in the strong-hire band.`
        : "No sessions have reached the strong-hire band yet.",
    ];

    const risks = [
      `${weakestSkill.label} is the weakest skill at ${weakestSkill.value}/100, leaving a ${scoreGap}-point gap from the top skill.`,
      weakestRound
        ? `${weakestRound.label} is the lowest-converting round with ${weakestRound.passRate}% pass rate.`
        : "Round-level weakness cannot be isolated yet.",
      passRate < 70
        ? `Overall pass rate is ${passRate}%, so more sessions are failing than a healthy pipeline should allow.`
        : `Pass rate is ${passRate}%, but stronger conversion is still needed before the profile looks reliably interview-ready.`,
    ];

    const actions = [
      `Prioritize ${weakestSkill.label.toLowerCase()} in the next 2 interview sessions with explicit follow-up on explanation quality and structure.`,
      weakestRound
        ? `Run one focused ${weakestRound.label.toLowerCase()} practice loop next and compare the delta after refresh.`
        : "Add another evaluated session so round-level comparison becomes meaningful.",
      strongestSkill.label !== weakestSkill.label
        ? `Keep ${strongestSkill.label.toLowerCase()} stable while raising ${weakestSkill.label.toLowerCase()} to at least ${Math.min(strongestSkill.value - 5, 75)}/100.`
        : "Keep session volume high so the current pattern becomes statistically clearer.",
    ];

    return {
      summary,
      headline: `AI report for ${selectedRole === "All Roles" ? "all tracked roles" : selectedRole}`,
      readiness,
      strengths,
      risks,
      actions,
    };
  }, [
    avgScore,
    passRate,
    rankedSkills,
    roundStats,
    selectedRole,
    strongHireRate,
    totalSessions,
  ]);

  return (
    <DashboardLayout
      projectName="AIX"
      projectSubtitle="Interview AI"
      navItems={navItems}
      aiShortcuts={aiShortcuts}
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-7">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Deep-dive into hiring metrics, skill trends & candidate performance.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Period */}
          <div className="relative">
            <button
              onClick={() => { setPeriodOpen(o => !o); setRoleOpen(false); }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-indigo-300 transition"
            >
              {selectedPeriod}
              <ChevronDownIcon className="h-4 w-4 text-slate-400" />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-2 z-20 w-44 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                {periods.map(p => (
                  <button key={p} onClick={() => { setSelectedPeriod(p); setPeriodOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-indigo-50 hover:text-indigo-700 ${selectedPeriod === p ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700"}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="relative">
            <button
              onClick={() => { setRoleOpen(o => !o); setPeriodOpen(false); }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-indigo-300 transition"
            >
              {selectedRole}
              <ChevronDownIcon className="h-4 w-4 text-slate-400" />
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                {roleOptions.map(r => (
                  <button key={r} onClick={() => { setSelectedRole(r); setRoleOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-indigo-50 hover:text-indigo-700 ${selectedRole === r ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700"}`}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-indigo-300 transition">
            <AdjustmentsIcon className="h-4 w-4 text-slate-400" /> Filters
          </button>

          <button
            type="button"
            onClick={loadAnalyticsRecords}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-indigo-300 transition"
          >
            <RefreshIcon className="h-4 w-4 text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mb-6 rounded-3xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          Loading analytics from saved interview sessions...
        </div>
      ) : null}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={StatsIcon} label="Total Sessions" value={totalSessions.toLocaleString()}
          sub={`${selectedPeriod}`} trend={totalSessionsTrend} sparkPoints={weeklyScores}
          color="#6366f1" colorBg="#eef2ff"
          hoverDetails={{
            title: "Session Volume",
            items: [
              { label: "Current", value: totalSessions.toLocaleString(), note: selectedPeriod },
              { label: "Previous", value: prevTotalSessions.toLocaleString(), note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Candidates", value: activeCandidates.toLocaleString(), note: "active in filter" },
              { label: "Sessions/Candidate", value: sessionsPerCandidate, note: "depth of practice" },
            ],
          }} />
        <StatCard icon={TrendUpIcon} label="Avg Score" value={`${avgScore}/100`}
          sub="across all rounds" trend={avgScoreTrend} sparkPoints={weeklyScores}
          color="#0ea5e9" colorBg="#e0f2fe"
          hoverDetails={{
            title: "Score Quality",
            items: [
              { label: "Current Avg", value: `${avgScore}`, note: "out of 100" },
              { label: "Previous Avg", value: `${prevAvgScore}`, note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Pass Avg", value: `${avgPassingScore}`, note: "sessions >= 70" },
              { label: "Needs Help Avg", value: `${avgFailingScore}`, note: "sessions < 70" },
            ],
          }} />
        <StatCard icon={StatsIcon} label="Strong Hire Rate" value={`${strongHireRate}%`}
          sub={`${strongHireCandidates} candidates`} trend={strongHireTrend}
          color="#10b981" colorBg="#d1fae5"
          hoverDetails={{
            title: "Hire Readiness",
            items: [
              { label: "Current Rate", value: `${strongHireRate}%`, note: "score >= 85" },
              { label: "Previous Rate", value: `${prevStrongHireRate}%`, note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Strong Sessions", value: `${strongHireCount}`, note: "meeting bar" },
              { label: "Strong Candidates", value: `${strongHireCandidates}`, note: "unique profiles" },
            ],
          }} />
        <StatCard icon={StatsIcon} label="Avg Duration" value={`${avgDuration}m`}
          sub="per session" trend={avgDurationTrend} trendDirection="down"
          color="#f59e0b" colorBg="#fef3c7"
          hoverDetails={{
            title: "Session Time",
            items: [
              { label: "Current Avg", value: `${avgDuration} min`, note: "all rounds" },
              { label: "Previous Avg", value: `${prevAvgDuration} min`, note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Fastest Round", value: "HR Interview", note: "~24 min baseline" },
              { label: "Longest Round", value: "Technical", note: "~39 min baseline" },
            ],
          }} />
      </div>

      {/* ── Second KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={StatsIcon} label="Comm Score" value={avgComm} trend={commTrend} color="#8b5cf6" colorBg="#ede9fe"
          hoverDetails={{
            title: "Communication Quality",
            items: [
              { label: "Current", value: `${avgComm}`, note: "clarity and structure" },
              { label: "Previous", value: `${prevAvgComm}`, note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Top Role", value: `${strongestRole.label}`, note: `${strongestRole.score}/100 readiness` },
              { label: "Lowest Role", value: `${weakestRole.label}`, note: `${weakestRole.score}/100 readiness` },
            ],
          }} />
        <StatCard icon={StatsIcon} label="Tech Score" value={avgTech} trend={techTrend} color="#06b6d4" colorBg="#cffafe"
          hoverDetails={{
            title: "Technical Depth",
            items: [
              { label: "Current", value: `${avgTech}`, note: "role-fit depth" },
              { label: "Previous", value: `${prevAvgTech}`, note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Technical Rounds", value: `${roundStats.find((r) => r.label === "Technical Interview")?.count || 0}`, note: "in selected filter" },
              { label: "Best Band", value: scoreBucketPeak.label, note: `${scoreBucketPeak.count} sessions` },
            ],
          }} />
        <StatCard icon={StatsIcon} label="Pass Rate" value={`${passRate}%`} trend={passRateTrend} color="#f43f5e" colorBg="#ffe4e6"
          hoverDetails={{
            title: "Pass Outcomes",
            items: [
              { label: "Passed", value: `${passCount}`, note: "score >= 70" },
              { label: "Needs Review", value: `${Math.max(totalSessions - passCount, 0)}`, note: "score < 70" },
              { label: "Current Rate", value: `${passRate}%`, note: "selected filter" },
              { label: "Previous Rate", value: `${prevPassRate}%`, note: shouldShowTrend ? "prior window" : "n/a" },
            ],
          }} />
        <StatCard icon={StatsIcon} label="Active Candidates" value={activeCandidates} trend={activeCandidatesTrend} color="#0ea5e9" colorBg="#e0f2fe"
          hoverDetails={{
            title: "Candidate Coverage",
            items: [
              { label: "Current", value: `${activeCandidates}`, note: "unique candidates" },
              { label: "Previous", value: `${prevActiveCandidates}`, note: shouldShowTrend ? "prior window" : "n/a" },
              { label: "Top Candidate", value: topCandidates[0]?.name || "-", note: `${topCandidates[0]?.avg || 0}/100 avg` },
              { label: "Filter", value: selectedRole, note: selectedPeriod },
            ],
          }} />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid gap-5 xl:grid-cols-3 mb-5">

        {/* Score Distribution */}
        <Section title="Score Distribution" sub="All sessions by score band">
          <div className="flex items-end gap-2 h-20 mb-4">
            {scoreBuckets.map(b => (
              <DetailHover
                key={b.label}
                className="flex-1"
                details={{
                  title: `${b.label} Distribution`,
                  items: [
                    { label: "Sessions", value: `${b.count}`, note: `${b.share}% of total` },
                    { label: "Avg Score", value: `${b.avgScore || 0}`, note: "in this range" },
                    { label: "Qualified", value: `${b.passCount}`, note: "score >= 70" },
                    { label: "Range", value: b.label, note: "score band" },
                  ],
                }}
              >
                <VerticalBar value={b.count} max={b.max} color={b.color} label={b.label} />
              </DetailHover>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {scoreBuckets.map(b => (
              <span key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
                {b.label}
              </span>
            ))}
          </div>
        </Section>

        {/* Skill Radar (table style) */}
        <Section title="Skill Averages" sub="Hover a skill to inspect" action={
          <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold rounded-full px-3 py-1">
            {totalSessions} sessions
          </span>
        }>
          <div className="space-y-3">
            {skillAverages.map((s, i) => {
              const color = colorPalette[i % colorPalette.length];
              const delta = s.value - (prevSkillMap[s.key] || 0);
              return (
                <DetailHover
                  key={s.key}
                  details={{
                    title: `${s.label} Detail`,
                    items: [
                      { label: "Current", value: `${s.value}`, note: "out of 100" },
                      { label: "Previous", value: `${prevSkillMap[s.key] || 0}`, note: "prior window" },
                      { label: "Delta", value: `${delta >= 0 ? "+" : ""}${delta}`, note: "period change" },
                      { label: "Rank", value: `#${skillRankMap[s.key] || 0}`, note: `top: ${topSkill.label}` },
                    ],
                  }}
                >
                  <div
                    className={`rounded-xl p-3 cursor-pointer transition ${activeSkill === s.key ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                    onClick={() => setActiveSkill(activeSkill === s.key ? null : s.key)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">{s.label}</span>
                      <span className="text-xs font-bold" style={{ color }}>{s.value}</span>
                    </div>
                    <MiniBar value={s.value} max={100} color={color} />
                  </div>
                </DetailHover>
              );
            })}
          </div>
        </Section>

        {/* Round Funnel */}
        <Section title="Round Performance" sub="Sessions & avg score per type">
          <div className="space-y-4">
            {roundStats.map((r, i) => {
              const color = colorPalette[i % colorPalette.length];
              const band = scoreBand(r.avgScore);
              return (
                <DetailHover
                  key={r.label}
                  details={{
                    title: `${r.label} Breakdown`,
                    items: [
                      { label: "Sessions", value: `${r.count}`, note: "in current filter" },
                      { label: "Avg Duration", value: `${r.avgDuration}m`, note: "time spent" },
                      { label: "Best Score", value: `${r.bestScore}`, note: "highest in round" },
                      { label: "Needs Review", value: `${r.review}`, note: "below pass bar" },
                    ],
                  }}
                >
                  <div className="rounded-2xl border border-slate-100 p-4 hover:bg-slate-50/70 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                      <span className="text-xs font-bold rounded-full px-2 py-0.5"
                        style={{ background: band.bg, color: band.text }}>{band.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <MiniBar value={r.count} max={roundMax} color={color} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{r.count}</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-slate-400">Avg: <span className="font-semibold text-slate-700">{r.avgScore}</span></span>
                      <span className="text-xs text-slate-400">Pass: <span className="font-semibold text-emerald-600">{r.pass}</span></span>
                      <span className="text-xs text-slate-400">Rate: <span className="font-semibold text-slate-700">{r.passRate}%</span></span>
                    </div>
                  </div>
                </DetailHover>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid gap-5 xl:grid-cols-2 mb-5">

        {/* Role Readiness */}
        <Section title="Role Readiness" sub="Average score per role track" action={
          <span className="text-xs text-slate-400">{roleBreakdown.length} roles</span>
        }>
          <div className="space-y-4">
            {roleBreakdown.map((r, i) => {
              const color = colorPalette[i % colorPalette.length];
              const roleData = roleMetrics[r.label] || { count: 0, strongRate: 0, best: 0 };
              return (
                <DetailHover
                  key={r.label}
                  details={{
                    title: `${r.label} Readiness`,
                    items: [
                      { label: "Readiness", value: `${r.score}/100`, note: "average score" },
                      { label: "Sessions", value: `${roleData.count}`, note: "role-specific rounds" },
                      { label: "Strong Hire Rate", value: `${roleData.strongRate}%`, note: "score >= 85" },
                      { label: "Best Session", value: `${roleData.best}`, note: "peak performance" },
                    ],
                  }}
                >
                  <div className="rounded-2xl px-2 py-2 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ background: color }} />
                        {r.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{r.score}<span className="text-xs text-slate-400">/100</span></span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.score}%`, background: color }} />
                    </div>
                  </div>
                </DetailHover>
              );
            })}
          </div>
        </Section>

        {/* Top Candidates */}
        <Section title="Top Candidates" sub="Ranked by average session score">
          <div className="space-y-2">
            {topCandidates.map((c, i) => {
              const style = roleStyles[c.role] || roleStyles.default;
              const band = scoreBand(c.avg);
              const initials = c.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
              return (
                <DetailHover
                  key={c.name}
                  details={{
                    title: `${c.name}`,
                    items: [
                      { label: "Average", value: `${c.avg}`, note: `${c.sessions} sessions` },
                      { label: "Trend", value: `${c.trend >= 0 ? "+" : ""}${c.trend}`, note: "first vs latest" },
                      { label: "Best Score", value: `${c.bestScore}`, note: `${c.roundsCount} round types` },
                      { label: "Latest Session", value: formatDate(c.lastDate), note: c.role },
                    ],
                  }}
                >
                  <div className="flex items-center gap-3 rounded-2xl p-3 hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-xs font-bold text-slate-300 w-4 text-right">{i + 1}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${style.avatarClass} text-white text-xs font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.role} · {c.sessions} sessions</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: band.text }}>{c.avg}</p>
                      <p className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 mt-0.5" style={{ background: band.bg, color: band.text }}>{band.label}</p>
                    </div>
                  </div>
                </DetailHover>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── Skill Gauges Row ── */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-base font-bold text-slate-900">Skill Gauges</p>
            <p className="text-xs text-slate-400 mt-0.5">Visual readiness for each dimension</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {skillAverages.map((s, i) => {
            const color = colorPalette[i % colorPalette.length];
            const gapToTop = Math.max(topSkill.value - s.value, 0);
            return (
              <DetailHover
                key={s.key}
                details={{
                  title: `${s.label} Gauge`,
                  items: [
                    { label: "Gauge Score", value: `${s.value}`, note: "out of 100" },
                    { label: "Rank", value: `#${skillRankMap[s.key] || 0}`, note: "among all skills" },
                    { label: "Gap To Top", value: `${gapToTop}`, note: `${topSkill.label}` },
                    { label: "Previous", value: `${prevSkillMap[s.key] || 0}`, note: "prior window" },
                  ],
                }}
              >
                <div className="flex flex-col items-center gap-2 rounded-2xl p-2 hover:bg-slate-50 transition">
                  <div className="relative">
                    <RadialGauge value={s.value} color={color} size={72} stroke={7} />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">{s.value}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 text-center leading-4">{s.label}</p>
                </div>
              </DetailHover>
            );
          })}
        </div>
      </div>

      {/* ── AI Insights Banner ── */}
      <div className="rounded-3xl p-6 mb-2" style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white">
            <StatsIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-base">AI Insight</p>
            <p className="text-white/80 text-sm mt-0.5">
              {aiInsight.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="shrink-0 rounded-2xl bg-white/20 hover:bg-white/30 transition text-white text-sm font-semibold px-5 py-2.5"
          >
            View Report →
          </button>
        </div>
      </div>

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                  AI Report
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {aiInsight.headline}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {aiInsight.readiness}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Executive Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {aiInsight.summary}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Strengths</p>
                <div className="mt-3 space-y-2">
                  {aiInsight.strengths.length ? aiInsight.strengths.map((item) => (
                    <p key={item} className="text-sm leading-6 text-slate-600">
                      {item}
                    </p>
                  )) : (
                    <p className="text-sm leading-6 text-slate-500">
                      No clear strength available yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Risks</p>
                <div className="mt-3 space-y-2">
                  {aiInsight.risks.map((item) => (
                    <p key={item} className="text-sm leading-6 text-slate-600">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Recommended Actions</p>
                <div className="mt-3 space-y-2">
                  {aiInsight.actions.map((item) => (
                    <p key={item} className="text-sm leading-6 text-slate-600">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
