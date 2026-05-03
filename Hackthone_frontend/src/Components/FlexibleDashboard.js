import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import CommandCenterWidget from "./dashboard/widgets/CommandCenterWidget";
import StrengthsAnalysisWidget from "./dashboard/widgets/StrengthsAnalysisWidget";
import RecommendedMocksWidget from "./dashboard/widgets/RecommendedMocksWidget";
import LeaderboardWidget from "./dashboard/widgets/LeaderboardWidget";
import SkillGraphWidget from "./dashboard/widgets/SkillGraphWidget";
import SkillBreakdownWidget from "./dashboard/widgets/SkillBreakdownWidget";
import InterviewTrendWidget from "./dashboard/widgets/InterviewTrendWidget";
import PerformanceWidget from "./dashboard/widgets/PerformanceWidget";
import { navItems, aiShortcuts, skillMeta } from "./dashboard/data";

import { buildRoundPerformance } from "./dashboard/utils";
import { ChevronDownIcon, AdjustmentsIcon, RefreshIcon } from "./dashboard/Icons";
import { fetchInterviewRecords, fetchLeaderboard } from "../services/recordsApi";
import { useNavigate } from "react-router-dom";

export default function FlexibleDashboard() {
  const navigate = useNavigate();
  const [interviewRecords, setInterviewRecords] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [activeRecordId, setActiveRecordId] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadDashboardRecords = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const [interviewResponse, leaderboardResponse] = await Promise.all([
        fetchInterviewRecords({ scope: "mine" }),
        fetchLeaderboard({ scope: "all" }),
      ]);

      const myRecords = Array.isArray(interviewResponse?.records)
        ? interviewResponse.records
        : [];
      const globalLeaderboard = Array.isArray(leaderboardResponse?.leaderboard)
        ? leaderboardResponse.leaderboard
        : [];

      setInterviewRecords(myRecords);
      setLeaderboard(globalLeaderboard);
      setActiveRecordId((currentRecordId) => {
        if (currentRecordId && myRecords.some((record) => record.id === currentRecordId)) {
          return currentRecordId;
        }

        return myRecords[0]?.id || "";
      });
    } catch (error) {
      setLoadError(error.message || "Failed to load dashboard records.");
      setInterviewRecords([]);
      setLeaderboard([]);
      setActiveRecordId("");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardRecords();
  }, []);

  const roleOptions = useMemo(
    () => ["All Roles", ...new Set(interviewRecords.map((record) => record.role).filter(Boolean))],
    [interviewRecords],
  );

  // Filtering and sorting
  const filteredRecords = useMemo(
    () =>
      selectedRole === "All Roles"
        ? interviewRecords
        : interviewRecords.filter((record) => record.role === selectedRole),
    [interviewRecords, selectedRole],
  );

  const sortedRecords = useMemo(
    () =>
      [...filteredRecords].sort(
        (left, right) => new Date(right.date) - new Date(left.date),
      ),
    [filteredRecords],
  );

  const activeRecord = useMemo(
    () => sortedRecords.find((record) => record.id === activeRecordId) || sortedRecords[0] || null,
    [sortedRecords, activeRecordId],
  );

  const candidateRecords = useMemo(() => {
    if (!activeRecord?.candidate) {
      return [];
    }

    return [...interviewRecords]
      .filter((record) => record.candidate === activeRecord.candidate)
      .sort((left, right) => new Date(left.date) - new Date(right.date));
  }, [interviewRecords, activeRecord]);

  const skillMetrics = useMemo(
    () =>
      skillMeta.map((item) => ({
        ...item,
        value: activeRecord?.[item.key] || 0,
      })),
    [activeRecord],
  );

  const roundPerformance = useMemo(
    () => buildRoundPerformance(filteredRecords),
    [filteredRecords],
  );

  const headerActions = (
    <select
      value={selectedRole}
      onChange={(event) => setSelectedRole(event.target.value)}
      className="liquid-glass-chip rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 outline-none"
    >
      {roleOptions.map((role) => (
        <option key={role} value={role} className="text-slate-900">
          {role}
        </option>
      ))}
    </select>
  );

  useEffect(() => {
    if (!sortedRecords.length) {
      if (activeRecordId) {
        setActiveRecordId("");
      }
      return;
    }

    if (!activeRecordId || !sortedRecords.some((record) => record.id === activeRecordId)) {
      setActiveRecordId(sortedRecords[0].id);
    }
  }, [sortedRecords, activeRecordId]);

  const handleCandidateSelect = (candidateName) => {
    const candidateLatest = [...interviewRecords]
      .filter((r) => r.candidate === candidateName)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (candidateLatest) {
      setActiveRecordId(candidateLatest.id);
    }
  };

  return (
    <DashboardLayout
      projectName="AIX"
      projectSubtitle="Interview AI"
      navItems={navItems}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      aiShortcuts={aiShortcuts}
      headerActions={headerActions}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-6">
        <div>
          <h1 className="mt-2 text-[30px] font-bold tracking-tight text-white">
            My Interview Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Live performance pulled from your saved interview sessions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="liquid-glass-chip flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-100"
            onClick={loadDashboardRecords}
          >
            <RefreshIcon className="h-4 w-4 text-slate-400" />
            Refresh
          </button>
          <button
            type="button"
            className="liquid-glass-chip flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-100"
            onClick={() => navigate("/interviews")}
          >
            <AdjustmentsIcon className="h-4 w-4 text-slate-400" />
            Start Interview
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading your saved sessions...
        </div>
      ) : null}

      {!isLoading && !interviewRecords.length ? (
        <div className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">No saved sessions yet</h2>
          <p className="mt-3 text-sm text-slate-500">
            Complete an interview and your personal dashboard will populate from MongoDB automatically.
          </p>
          <button
            type="button"
            onClick={() => navigate("/interviews")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start Your First Interview
          </button>
        </div>
      ) : null}

      {!isLoading && interviewRecords.length ? (
      <div className="grid gap-6 xl:grid-cols-12">
        <CommandCenterWidget
          activeRecord={activeRecord}
          candidateRecords={candidateRecords}
        />
        <LeaderboardWidget leaderboard={leaderboard} onMemberSelect={handleCandidateSelect} />
        
        <StrengthsAnalysisWidget candidateRecords={candidateRecords} />
        <RecommendedMocksWidget candidateRecords={candidateRecords} />

        <InterviewTrendWidget
          activeRecordCandidate={activeRecord?.candidate || "Candidate"}
          candidateRecords={candidateRecords}
        />
        <SkillGraphWidget skillMetrics={skillMetrics} />
        
        <PerformanceWidget roundPerformance={roundPerformance} />
        <SkillBreakdownWidget skillMetrics={skillMetrics} />
      </div>
      ) : null}
    </DashboardLayout>
  );
}
