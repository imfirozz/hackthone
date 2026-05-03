import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";
import {
  TrophyIcon,
  TrendUpIcon,
  TrendDownIcon,
  SearchIcon,
  RefreshIcon,
} from "./dashboard/Icons";
import { getInitials, roleStyles } from "./dashboard/utils";
import { fetchLeaderboard } from "../services/recordsApi";

function getRankBadge(rank) {
  if (rank === 1) return { bg: "from-yellow-400 to-amber-500", icon: "🥇" };
  if (rank === 2) return { bg: "from-gray-300 to-gray-400", icon: "🥈" };
  if (rank === 3) return { bg: "from-amber-600 to-amber-700", icon: "🥉" };
  return null;
}

function getScoreColor(score) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 55) return "text-amber-600";
  return "text-rose-600";
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetchLeaderboard({ scope: "all" });
      const liveStudents = Array.isArray(response?.leaderboard)
        ? response.leaderboard.map((entry) => {
            const roleStyle = roleStyles[entry.role] || roleStyles.default;

            return {
              ...entry,
              initials: getInitials(entry.name || "User"),
              avatarClass: roleStyle.avatarClass,
              badgeClass: roleStyle.badgeClass,
            };
          })
        : [];

      setStudents(liveStudents);
    } catch (error) {
      setLoadError(error.message || "Failed to load leaderboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const normalizedQuery = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedQuery ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.company.toLowerCase().includes(normalizedQuery);
      const matchesRole = filterRole === "All" || student.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [students, searchTerm, filterRole]);

  const uniqueRoles = useMemo(
    () => ["All", ...new Set(students.map((student) => student.role).filter(Boolean))],
    [students],
  );

  return (
    <DashboardLayout
      projectName="AIX"
      projectSubtitle="Interview AI"
      navItems={navItems}
      activeNav="Leaderboard"
      aiShortcuts={aiShortcuts}
    >
      <div className="min-h-screen">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <TrophyIcon className="w-8 h-8 text-amber-500" />
              <h1 className="text-3xl font-bold text-slate-900">Global Leaderboard</h1>
            </div>
            <p className="text-slate-500 text-lg">
              Top performers across persisted interview sessions. Hover on any student to inspect their live metrics.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLeaderboard}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            <RefreshIcon className="h-4 w-4" />
            Refresh Leaderboard
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-70 max-w-md">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or company..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />
          </div>
          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
          >
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {loadError ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        <div className="bg-slate-50 rounded-t-2xl border border-slate-200 px-6 py-4 grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-3">Student</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2 text-center">Score</div>
          <div className="col-span-1 text-center">Trend</div>
          <div className="col-span-1 text-center">Sessions</div>
        </div>

        <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl divide-y divide-slate-100">
          {isLoading ? (
            <div className="px-6 py-14 text-sm text-slate-500">
              Loading leaderboard...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <TrophyIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">
                No leaderboard entries found for the current filters.
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const rankBadge = getRankBadge(student.rank);
              const isHovered = hoveredStudent?.name === student.name;

              return (
                <div
                  key={`${student.rank}-${student.name}`}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 scale-[1.01] shadow-lg shadow-slate-200/50"
                      : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setHoveredStudent(student)}
                  onMouseLeave={() => setHoveredStudent(null)}
                >
                  <div className="col-span-1 flex justify-center">
                    {rankBadge ? (
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${rankBadge.bg} flex items-center justify-center text-lg shadow-md`}
                      >
                        {rankBadge.icon}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        #{student.rank}
                      </div>
                    )}
                  </div>

                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.avatarClass} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                    >
                      {student.initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-base">{student.name}</p>
                      <p className="text-xs text-slate-400">🔥 {student.streak} day streak</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                      {student.role}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {student.company}
                    </span>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className={`text-lg font-bold ${getScoreColor(student.score)}`}>
                      {student.score}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {(student.delta || 0) >= 0 ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendUpIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold">
                          +{student.delta}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-600">
                        <TrendDownIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold">
                          {student.delta}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium text-slate-600">
                      {student.interviewsCompleted}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hoveredStudent ? (
          <div
            className="fixed z-50 bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 w-105 pointer-events-none"
            style={{ top: "50%", right: "80px", transform: "translateY(-50%)" }}
          >
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${hoveredStudent.avatarClass} flex items-center justify-center text-white text-xl font-bold shadow-lg`}
              >
                {hoveredStudent.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {hoveredStudent.name}
                  </h3>
                  {getRankBadge(hoveredStudent.rank) ? (
                    <span className="text-xl">
                      {getRankBadge(hoveredStudent.rank).icon}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-500">
                  {hoveredStudent.role} at {hoveredStudent.company}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(hoveredStudent.score)}`}
                  >
                    {hoveredStudent.score} pts
                  </span>
                  <span
                    className={`flex items-center gap-1 text-sm font-semibold ${
                      (hoveredStudent.delta || 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {(hoveredStudent.delta || 0) >= 0 ? (
                      <TrendUpIcon className="w-4 h-4" />
                    ) : (
                      <TrendDownIcon className="w-4 h-4" />
                    )}
                    {(hoveredStudent.delta || 0) >= 0 ? "+" : ""}
                    {hoveredStudent.delta}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Skill Breakdown
              </h4>
              <div className="space-y-2.5">
                {Object.entries(hoveredStudent.skills || {}).map(([skill, value]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 capitalize">
                        {skill.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span
                        className={`font-semibold ${
                          value >= 80
                            ? "text-emerald-600"
                            : value >= 65
                              ? "text-blue-600"
                              : "text-amber-600"
                        }`}
                      >
                        {value}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          value >= 80
                            ? "bg-emerald-500"
                            : value >= 65
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                  Strengths
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(hoveredStudent.strengths || []).length > 0 ? (
                    hoveredStudent.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="text-[10px] font-semibold bg-white text-emerald-700 px-2 py-1 rounded-lg"
                      >
                        {strength}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-emerald-600">Well-rounded</span>
                  )}
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                  To Improve
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(hoveredStudent.weaknesses || []).length > 0 ? (
                    hoveredStudent.weaknesses.map((weakness) => (
                      <span
                        key={weakness}
                        className="text-[10px] font-semibold bg-white text-amber-700 px-2 py-1 rounded-lg"
                      >
                        {weakness}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-amber-600">No visible gaps</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Recent Interviews
              </h4>
              <div className="space-y-2">
                {(hoveredStudent.recentInterviews || []).map((interview, index) => (
                  <div
                    key={`${hoveredStudent.name}-${index}`}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {interview.company[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {interview.company}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {interview.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${getScoreColor(interview.score)}`}>
                        {interview.score}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatShortDate(interview.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sessions
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {hoveredStudent.interviewsCompleted}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Streak
                </p>
                <p className="text-lg font-bold text-slate-900">
                  🔥 {hoveredStudent.streak}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rank
                </p>
                <p className="text-lg font-bold text-slate-900">
                  #{hoveredStudent.rank}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
