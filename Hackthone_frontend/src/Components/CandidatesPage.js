import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import { navItems, aiShortcuts } from "./dashboard/data";
import {
  UsersIcon,
  SearchIcon,
  TrendUpIcon,
  TrendDownIcon,
  RefreshIcon,
} from "./dashboard/Icons";
import {
  average,
  formatShortDate,
  getInitials,
  getOutcomeClass,
  getOutcomeLabel,
  roleStyles,
} from "./dashboard/utils";
import { fetchCandidateDirectory } from "../services/recordsApi";

function SummaryCard({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadCandidates = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetchCandidateDirectory({ scope: "all" });
      setCandidates(Array.isArray(response?.candidates) ? response.candidates : []);
    } catch (error) {
      setLoadError(error.message || "Failed to load candidate records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const roleOptions = useMemo(
    () => [
      "All Roles",
      ...new Set(candidates.map((candidate) => candidate.role).filter(Boolean)),
    ],
    [candidates],
  );

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !query ||
          candidate.name.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query) ||
          candidate.company.toLowerCase().includes(query);
        const matchesRole =
          selectedRole === "All Roles" || candidate.role === selectedRole;

        return matchesSearch && matchesRole;
      }),
    [candidates, searchTerm, selectedRole],
  );

  const totalSessions = useMemo(
    () => candidates.reduce((sum, candidate) => sum + (candidate.sessions || 0), 0),
    [candidates],
  );
  const averageScore = useMemo(
    () => average(candidates, (candidate) => candidate.avgScore || 0),
    [candidates],
  );
  const strongCandidates = useMemo(
    () => candidates.filter((candidate) => (candidate.avgScore || 0) >= 85).length,
    [candidates],
  );

  return (
    <DashboardLayout
      projectName="AIX"
      projectSubtitle="Interview AI"
      navItems={navItems}
      aiShortcuts={aiShortcuts}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-sky-600" />
              <h1 className="text-[30px] font-bold tracking-tight text-slate-900">
                Candidates
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Browse real candidate interview history, recent sessions, and score trends from MongoDB.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCandidates}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            <RefreshIcon className="h-4 w-4" />
            Refresh Records
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Candidates"
            value={candidates.length}
            note="Profiles with saved interview history"
          />
          <SummaryCard
            label="Sessions"
            value={totalSessions}
            note="Completed or in-progress interview records"
          />
          <SummaryCard
            label="Avg Score"
            value={`${averageScore}/100`}
            note="Average across all saved candidate sessions"
          />
          <SummaryCard
            label="Strong Profiles"
            value={strongCandidates}
            note="Candidates averaging 85 or above"
          />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by candidate, email, or company..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300"
            />
          </label>

          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {loadError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading candidate records...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <UsersIcon className="mx-auto h-14 w-14 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-700">
              No candidate records found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Run a few interview sessions first, or change the search and role filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => {
              const roleStyle =
                roleStyles[candidate.role] || roleStyles.default;
              const isPositiveTrend = (candidate.trend || 0) >= 0;

              return (
                <div
                  key={candidate.id}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roleStyle.avatarClass} text-sm font-bold tracking-[0.2em] text-white shadow-sm`}
                      >
                        {getInitials(candidate.name)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            {candidate.name}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyle.badgeClass}`}
                          >
                            {candidate.role}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {candidate.company}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {candidate.email || "No email stored"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(candidate.focusTags || []).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Avg Score
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {candidate.avgScore}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Sessions
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {candidate.sessions}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Streak
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {candidate.streak}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Trend
                        </p>
                        <p
                          className={`mt-2 inline-flex items-center gap-1 text-xl font-bold ${
                            isPositiveTrend ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPositiveTrend ? (
                            <TrendUpIcon className="h-4 w-4" />
                          ) : (
                            <TrendDownIcon className="h-4 w-4" />
                          )}
                          {isPositiveTrend ? "+" : ""}
                          {candidate.trend}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          Latest coaching note
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getOutcomeClass(
                            candidate.avgScore,
                          )}`}
                        >
                          {getOutcomeLabel(candidate.avgScore)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {candidate.latestFeedback}
                      </p>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Next step:{" "}
                        <span className="font-normal text-slate-500">
                          {candidate.nextStep}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-800">
                        Recent interviews
                      </p>
                      <div className="mt-3 space-y-2">
                        {(candidate.recentInterviews || []).map((interview, index) => (
                          <div
                            key={`${candidate.id}-${index}`}
                            className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {interview.company}
                              </p>
                              <p className="text-xs text-slate-400">
                                {interview.round} · {formatShortDate(interview.date)}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-slate-900">
                              {interview.score}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
