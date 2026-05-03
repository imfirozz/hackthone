import { useState } from "react";

const projectName = "AIX";

const navItems = [
  { label: "Dashboard", icon: GridIcon, active: true },
  { label: "Interviews", icon: FileIcon, active: false },
  { label: "Candidates", icon: UsersIcon, active: false },
  { label: "Leaderboard", icon: TrophyIcon, active: false },
  { label: "Analytics", icon: StatsIcon, active: false },
  { label: "Settings", icon: SettingsIcon, active: false },
];

const roleStyles = {
  "Frontend Developer": {
    avatarClass: "from-sky-500 to-indigo-600",
    badgeClass: "bg-sky-100 text-sky-700",
    barTone: "bg-sky-500",
    pillClass: "bg-sky-100 text-sky-700",
  },
  "Backend Developer": {
    avatarClass: "from-emerald-500 to-cyan-600",
    badgeClass: "bg-emerald-100 text-emerald-700",
    barTone: "bg-emerald-500",
    pillClass: "bg-emerald-100 text-emerald-700",
  },
  "Full Stack Developer": {
    avatarClass: "from-fuchsia-500 to-violet-600",
    badgeClass: "bg-fuchsia-100 text-fuchsia-700",
    barTone: "bg-fuchsia-500",
    pillClass: "bg-fuchsia-100 text-fuchsia-700",
  },
  "Java Developer": {
    avatarClass: "from-amber-500 to-orange-600",
    badgeClass: "bg-amber-100 text-amber-700",
    barTone: "bg-amber-500",
    pillClass: "bg-amber-100 text-amber-700",
  },
  "Python Developer": {
    avatarClass: "from-cyan-500 to-blue-600",
    badgeClass: "bg-cyan-100 text-cyan-700",
    barTone: "bg-cyan-500",
    pillClass: "bg-cyan-100 text-cyan-700",
  },
  default: {
    avatarClass: "from-slate-500 to-slate-700",
    badgeClass: "bg-slate-100 text-slate-700",
    barTone: "bg-slate-600",
    pillClass: "bg-slate-100 text-slate-700",
  },
};

const aiShortcuts = [
  {
    title: "Smart feedback for your next round",
    detail: "Surface the one response pattern that needs attention before the next mock.",
    icon: LightningIcon,
  },
  {
    title: "Turn raw answers into high-signal interview responses",
    detail: "Restructure vague answers into concise, recruiter-friendly talking points.",
    icon: WandIcon,
  },
  {
    title: "Revisit previous interviews with AI feedback",
    detail: "Compare older sessions with current scores and see if the coaching is working.",
    icon: ReplayIcon,
  },
];

const interviewRecords = [
  {
    id: "aix-001",
    candidate: "Aarav Singh",
    role: "Frontend Developer",
    round: "Resume Pitch",
    interviewer: "AIX Recruiter Bot",
    date: "2026-04-09",
    duration: 18,
    score: 72,
    communication: 76,
    technical: 68,
    confidence: 70,
    problemSolving: 74,
    systemDesign: 60,
    delivery: 71,
    feedback:
      "Clear project storytelling, but the answers need stronger technical detail when discussing state management and accessibility.",
    nextStep:
      "Open with impact, then show one concrete React example and one accessibility tradeoff.",
    focusTags: ["React", "Accessibility", "Portfolio"],
  },
  {
    id: "aix-002",
    candidate: "Aarav Singh",
    role: "Frontend Developer",
    round: "Technical Round",
    interviewer: "AIX UI Panel",
    date: "2026-04-13",
    duration: 31,
    score: 81,
    communication: 79,
    technical: 86,
    confidence: 78,
    problemSolving: 83,
    systemDesign: 72,
    delivery: 80,
    feedback:
      "Component reasoning is solid and the coding flow is faster, but architecture explanations still need more structure.",
    nextStep:
      "Practice explaining data flow, error states, and performance tradeoffs in under 60 seconds.",
    focusTags: ["Hooks", "Rendering", "Performance"],
  },
  {
    id: "aix-003",
    candidate: "Aarav Singh",
    role: "Frontend Developer",
    round: "Final Mock",
    interviewer: "AIX Senior Engineer",
    date: "2026-04-18",
    duration: 36,
    score: 89,
    communication: 88,
    technical: 90,
    confidence: 87,
    problemSolving: 86,
    systemDesign: 78,
    delivery: 90,
    feedback:
      "This session feels much closer to a real offer-ready performance. Answers are sharper and examples sound credible.",
    nextStep:
      "Keep the same structure and spend one more session improving architecture tradeoff depth.",
    focusTags: ["React", "Testing", "Design Systems"],
  },
  {
    id: "aix-004",
    candidate: "Meera Patel",
    role: "Backend Developer",
    round: "Resume Pitch",
    interviewer: "AIX Recruiter Bot",
    date: "2026-04-10",
    duration: 17,
    score: 74,
    communication: 75,
    technical: 72,
    confidence: 73,
    problemSolving: 71,
    systemDesign: 69,
    delivery: 74,
    feedback:
      "Good ownership examples, but backend impact needs to be tied to scale, latency, or reliability outcomes.",
    nextStep:
      "Rewrite project explanations using throughput, caching, or failure recovery language.",
    focusTags: ["APIs", "Ownership", "Metrics"],
  },
  {
    id: "aix-005",
    candidate: "Meera Patel",
    role: "Backend Developer",
    round: "Technical Round",
    interviewer: "AIX Platform Panel",
    date: "2026-04-14",
    duration: 34,
    score: 84,
    communication: 79,
    technical: 88,
    confidence: 81,
    problemSolving: 86,
    systemDesign: 80,
    delivery: 82,
    feedback:
      "System thinking is better and the API design choices are clearer. Queueing and observability were handled well.",
    nextStep:
      "Keep pushing on tradeoff framing and explicitly state scale assumptions before proposing architecture.",
    focusTags: ["Node.js", "Caching", "Observability"],
  },
  {
    id: "aix-006",
    candidate: "Meera Patel",
    role: "Backend Developer",
    round: "System Design",
    interviewer: "AIX Architecture Board",
    date: "2026-04-19",
    duration: 42,
    score: 91,
    communication: 86,
    technical: 93,
    confidence: 88,
    problemSolving: 90,
    systemDesign: 94,
    delivery: 89,
    feedback:
      "Excellent progression. The architecture walkthrough is calm, layered, and grounded in measurable constraints.",
    nextStep:
      "Stay consistent under time pressure and keep one backup design alternative ready.",
    focusTags: ["Distributed Systems", "Queues", "Databases"],
  },
  {
    id: "aix-007",
    candidate: "Rohan Das",
    role: "Full Stack Developer",
    round: "Technical Round",
    interviewer: "AIX Full Stack Panel",
    date: "2026-04-11",
    duration: 29,
    score: 77,
    communication: 74,
    technical: 80,
    confidence: 75,
    problemSolving: 78,
    systemDesign: 73,
    delivery: 76,
    feedback:
      "Breadth is there, but the session needs a cleaner separation between frontend and backend tradeoffs.",
    nextStep:
      "Use a simple structure: user flow, API contract, state model, then deployment or scaling detail.",
    focusTags: ["REST APIs", "React", "State Flow"],
  },
  {
    id: "aix-008",
    candidate: "Rohan Das",
    role: "Full Stack Developer",
    round: "Final Mock",
    interviewer: "AIX Hiring Manager",
    date: "2026-04-16",
    duration: 38,
    score: 85,
    communication: 82,
    technical: 87,
    confidence: 83,
    problemSolving: 84,
    systemDesign: 80,
    delivery: 85,
    feedback:
      "The answer flow feels much more balanced. Tradeoffs are clearer and examples feel closer to production work.",
    nextStep:
      "One more round focused on deployment and monitoring will make the story even more complete.",
    focusTags: ["Next.js", "Node.js", "Deployment"],
  },
  {
    id: "aix-009",
    candidate: "Kavya Iyer",
    role: "Python Developer",
    round: "HR Interview",
    interviewer: "AIX People Team",
    date: "2026-04-08",
    duration: 21,
    score: 69,
    communication: 72,
    technical: 65,
    confidence: 68,
    problemSolving: 66,
    systemDesign: 60,
    delivery: 70,
    feedback:
      "Behavioral answers show sincerity, but examples need stronger ownership and measurable outcomes.",
    nextStep:
      "Practice STAR answers with one specific conflict and one clear result metric.",
    focusTags: ["STAR", "Ownership", "Communication"],
  },
  {
    id: "aix-010",
    candidate: "Kavya Iyer",
    role: "Python Developer",
    round: "Technical Round",
    interviewer: "AIX Data Panel",
    date: "2026-04-17",
    duration: 33,
    score: 87,
    communication: 82,
    technical: 91,
    confidence: 85,
    problemSolving: 88,
    systemDesign: 79,
    delivery: 86,
    feedback:
      "Python fundamentals, data handling, and debugging decisions are much stronger now. SQL explanations were crisp too.",
    nextStep:
      "Keep reinforcing system thinking so the jump from coding to architecture feels seamless.",
    focusTags: ["Python", "SQL", "Debugging"],
  },
  {
    id: "aix-011",
    candidate: "Dev Malhotra",
    role: "Java Developer",
    round: "Technical Round",
    interviewer: "AIX Java Panel",
    date: "2026-04-12",
    duration: 30,
    score: 80,
    communication: 76,
    technical: 84,
    confidence: 77,
    problemSolving: 82,
    systemDesign: 75,
    delivery: 79,
    feedback:
      "OOP and collections are solid, but the solution explanation can be more concise under time pressure.",
    nextStep:
      "Rehearse short explanations for complexity, edge cases, and class design decisions.",
    focusTags: ["Java", "OOP", "DSA"],
  },
  {
    id: "aix-012",
    candidate: "Dev Malhotra",
    role: "Java Developer",
    round: "Final Mock",
    interviewer: "AIX Engineering Manager",
    date: "2026-04-18",
    duration: 37,
    score: 86,
    communication: 83,
    technical: 88,
    confidence: 84,
    problemSolving: 85,
    systemDesign: 81,
    delivery: 86,
    feedback:
      "Very steady session. You are describing architecture and implementation choices with more confidence.",
    nextStep:
      "Spend one more session tightening concurrency and JVM performance answers.",
    focusTags: ["Spring Boot", "Concurrency", "JVM"],
  },
];

const skillMeta = [
  {
    key: "communication",
    label: "Communication",
    note: "How clearly the answer is structured and paced.",
    tone: "bg-sky-500",
  },
  {
    key: "technical",
    label: "Technical Depth",
    note: "Correctness and role-specific implementation detail.",
    tone: "bg-indigo-600",
  },
  {
    key: "confidence",
    label: "Confidence",
    note: "Calm delivery under time pressure.",
    tone: "bg-cyan-500",
  },
  {
    key: "problemSolving",
    label: "Problem Solving",
    note: "Breakdown quality and logical sequencing.",
    tone: "bg-emerald-500",
  },
  {
    key: "systemDesign",
    label: "System Design",
    note: "Architecture framing and tradeoff awareness.",
    tone: "bg-fuchsia-500",
  },
  {
    key: "delivery",
    label: "Delivery",
    note: "Examples, close, and follow-up handling.",
    tone: "bg-amber-500",
  },
];

const average = (items, selector) =>
  items.length
    ? Math.round(items.reduce((sum, item) => sum + selector(item), 0) / items.length)
    : 0;

const getInitials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatShortDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const getOutcomeLabel = (score) => {
  if (score >= 85) {
    return "Strong Hire";
  }

  if (score >= 78) {
    return "On Track";
  }

  return "Needs Coaching";
};

const getOutcomeClass = (score) => {
  if (score >= 85) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (score >= 78) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-rose-100 text-rose-700";
};

const buildLeaderboard = (records) => {
  const grouped = records.reduce((accumulator, record) => {
    if (!accumulator[record.candidate]) {
      accumulator[record.candidate] = [];
    }

    accumulator[record.candidate].push(record);
    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((group) => {
      const sorted = [...group].sort(
        (left, right) => new Date(left.date) - new Date(right.date)
      );
      const lastRecord = sorted[sorted.length - 1];
      const firstRecord = sorted[0];
      const style = roleStyles[lastRecord.role] || roleStyles.default;

      return {
        name: lastRecord.candidate,
        role: lastRecord.role,
        score: average(sorted, (item) => item.score),
        delta: lastRecord.score - firstRecord.score,
        sessions: sorted.length,
        initials: getInitials(lastRecord.candidate),
        avatarClass: style.avatarClass,
        badgeClass: style.badgeClass,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};

const buildRoleReadiness = (records) => {
  const grouped = records.reduce((accumulator, record) => {
    if (!accumulator[record.role]) {
      accumulator[record.role] = [];
    }

    accumulator[record.role].push(record);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([role, items]) => {
      const style = roleStyles[role] || roleStyles.default;
      const value = average(items, (item) => item.score);

      return {
        label: role,
        score: value,
        width: `${value}%`,
        tone: style.barTone,
        badgeClass: style.badgeClass,
      };
    })
    .sort((left, right) => right.score - left.score);
};

const buildRoundPerformance = (records) => {
  const stages = [
    "Resume Pitch",
    "Technical Round",
    "System Design",
    "HR Interview",
    "Final Mock",
  ];

  return stages
    .filter((stage) => records.some((record) => record.round === stage))
    .map((stage) => {
      const matching = records.filter((record) => record.round === stage);

      return {
        label: stage,
        pass: matching.filter((record) => record.score >= 80).length,
        review: matching.filter((record) => record.score < 80).length,
      };
    });
};

const pointFromAngle = (angle, radius, center) => {
  const radians = (angle * Math.PI) / 180;

  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
};

export default function Dashboard() {
  const roleOptions = [
    "All Roles",
    ...new Set(interviewRecords.map((record) => record.role)),
  ];

  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [activeRecordId, setActiveRecordId] = useState(interviewRecords[0].id);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const filteredRecords =
    selectedRole === "All Roles"
      ? interviewRecords
      : interviewRecords.filter((record) => record.role === selectedRole);

  const sortedRecords = [...filteredRecords].sort(
    (left, right) => new Date(right.date) - new Date(left.date)
  );

  const activeRecord =
    sortedRecords.find((record) => record.id === activeRecordId) || sortedRecords[0];

  const activeRoleStyle =
    roleStyles[activeRecord?.role] || roleStyles.default;

  const candidateRecords = [...interviewRecords]
    .filter((record) => record.candidate === activeRecord.candidate)
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  const skillMetrics = skillMeta.map((item) => ({
    ...item,
    value: activeRecord[item.key],
  }));

  const leaderboard = buildLeaderboard(filteredRecords);
  const roleReadiness = buildRoleReadiness(interviewRecords);
  const roundPerformance = buildRoundPerformance(filteredRecords);

  const totalSessions = filteredRecords.length;
  const averageScore = average(filteredRecords, (record) => record.score);
  const averageDuration = average(filteredRecords, (record) => record.duration);
  const strongHireRate = Math.round(
    (filteredRecords.filter((record) => record.score >= 85).length /
      filteredRecords.length) *
      100
  );

  const firstCandidateScore = candidateRecords[0]?.score || activeRecord.score;
  const lastCandidateScore =
    candidateRecords[candidateRecords.length - 1]?.score || activeRecord.score;
  const candidateGrowth = lastCandidateScore - firstCandidateScore;

  const center = 136;
  const radius = 90;
  const angleStep = 360 / skillMetrics.length;

  const graphPoints = skillMetrics.map((item, index) => {
    const angle = -90 + angleStep * index;

    return {
      ...item,
      axisPoint: pointFromAngle(angle, radius, center),
      labelPoint: pointFromAngle(angle, radius + 40, center),
      valuePoint: pointFromAngle(angle, (item.value / 100) * radius, center),
    };
  });

  const polygonPoints = graphPoints
    .map((item) => `${item.valuePoint.x},${item.valuePoint.y}`)
    .join(" ");

  const rings = [1, 0.75, 0.5, 0.25].map((scale) =>
    graphPoints
      .map((item, index) => {
        const point = pointFromAngle(-90 + angleStep * index, radius * scale, center);

        return `${point.x},${point.y}`;
      })
      .join(" ")
  );

  const trendScores = candidateRecords.map((item) => item.score);
  const trendMin = Math.min(...trendScores);
  const trendMax = Math.max(...trendScores);
  const trendRange = trendMax - trendMin || 1;

  const trendPoints = candidateRecords.map((item, index) => {
    const x = 28 + index * (304 / Math.max(candidateRecords.length - 1, 1));
    const y = 128 - ((item.score - trendMin) / trendRange) * 88;

    return {
      ...item,
      x,
      y,
    };
  });

  const trendPolyline = trendPoints.map((item) => `${item.x},${item.y}`).join(" ");
  const trendArea = `28,128 ${trendPolyline} 332,128`;

  const roundScaleMax = Math.max(
    4,
    ...roundPerformance.map((item) => item.pass + item.review)
  );
  const roundTicks = [
    roundScaleMax,
    Math.ceil(roundScaleMax * 0.75),
    Math.ceil(roundScaleMax * 0.5),
    Math.ceil(roundScaleMax * 0.25),
    0,
  ];

  return (
    <div className="min-h-screen bg-[#e7ebf3] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-480 overflow-hidden rounded-[38px] bg-[#f9fbff] shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
        <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex min-h-full flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <LogoIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[30px] font-bold tracking-tight text-slate-900">
                    AIX
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Interview AI
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded-xl border border-slate-200 p-2 text-slate-500"
                onClick={() => alert("Sidebar Toggle Clicked")}
              >
                <SidebarToggleIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="px-5 py-8">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveNav(item.label)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition ${
                        activeNav === item.label
                          ? "bg-linear-to-r from-sky-500 to-indigo-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)]"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-slate-200 px-5 py-6">
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
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/50"
                      onClick={() => alert(`${item.title} Clicked`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-5 text-slate-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto px-5 pb-6">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                onClick={() => alert("Leave Feedback Clicked")}
              >
                <span className="flex items-center gap-3">
                  <FeedbackIcon className="h-5 w-5" />
                  Leave Feedback
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <main className="min-w-0 bg-[#f9fbff]">
            <div className="border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <label className="flex w-full max-w-105 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <SearchIcon className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search interview records..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                    onClick={() => alert("Role Dropdown Clicked")}
                  >
                    {selectedRole}
                    <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                    onClick={() => alert("Invite Candidate Clicked")}
                  >
                    Invite Candidate
                  </button>

                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500"
                    onClick={() => alert("Notifications Clicked")}
                  >
                    <BellIcon className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-3 rounded-2xl bg-white px-2 py-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-sky-400 via-cyan-400 to-indigo-500 text-sm font-bold text-white">
                      AX
                    </div>
                    <div className="pr-1">
                      <p className="text-sm font-semibold text-slate-900">AIX Coach</p>
                      <p className="text-xs text-slate-400">Interview admin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 lg:px-10 lg:py-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h1 className="mt-2 text-[30px] font-bold tracking-tight text-slate-900">
                    My Website Name
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                    onClick={() => alert("Time Filter Clicked")}
                  >
                    Last 14 days
                    <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                    onClick={() => alert("Filter Clicked")}
                  >
                    Filter
                    <AdjustmentsIcon className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-12">
                <section className="rounded-[30px] bg-linear-to-br from-[#0f172a] via-[#1d4ed8] to-[#06b6d4] p-7 text-white shadow-[0_28px_70px_rgba(29,78,216,0.25)] xl:col-span-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
                        AIX Command Center
                      </p>
                      <h2 className="mt-4 text-[26px] font-bold leading-tight">
                        Wider interview dashboard for live mock session tracking
                      </h2>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                      <SparkIcon className="h-9 w-9" />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          const firstRecord =
                            role === "All Roles"
                              ? interviewRecords[0]
                              : interviewRecords.find((record) => record.role === role);

                          setSelectedRole(role);
                          if (firstRecord) {
                            setActiveRecordId(firstRecord.id);
                          }
                        }}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          selectedRole === role
                            ? "bg-white text-slate-900"
                            : "bg-white/10 text-sky-50 hover:bg-white/20"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/10 px-5 py-5">
                      <p className="text-4xl font-bold tracking-tight">
                        {totalSessions}
                      </p>
                      <p className="mt-1 text-sm text-sky-100">Sessions tracked</p>
                    </div>
                    <div className="rounded-3xl bg-white/10 px-5 py-5">
                      <p className="text-4xl font-bold tracking-tight">
                        {averageScore}
                      </p>
                      <p className="mt-1 text-sm text-sky-100">Average score</p>
                    </div>
                    <div className="rounded-3xl bg-white/10 px-5 py-5">
                      <p className="text-4xl font-bold tracking-tight">
                        {strongHireRate}%
                      </p>
                      <p className="mt-1 text-sm text-sky-100">Strong hire rate</p>
                    </div>
                    <div className="rounded-3xl bg-white/10 px-5 py-5">
                      <p className="text-4xl font-bold tracking-tight">
                        {averageDuration}m
                      </p>
                      <p className="mt-1 text-sm text-sky-100">Average duration</p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                      Live focus
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {activeRecord.candidate} is currently highlighted for the{" "}
                      {activeRecord.round} flow.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sky-100">
                      The cards on this page are using this record and the
                      matching candidate history to drive skills, trends, and
                      performance views.
                    </p>
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Interview Records
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Click any session and the dashboard will recalculate from it
                      </p>
                    </div>
                    <FileIcon className="h-6 w-6 text-sky-600" />
                  </div>

                  <div className="mt-6 grid gap-4 2xl:grid-cols-[330px_minmax(0,1fr)]">
                    <div className="space-y-3">
                      {sortedRecords.map((record) => {
                        const style =
                          roleStyles[record.role] || roleStyles.default;

                        return (
                          <button
                            key={record.id}
                            type="button"
                            onClick={() => setActiveRecordId(record.id)}
                            className={`w-full rounded-3xl border p-4 text-left transition ${
                              activeRecord.id === record.id
                                ? "border-sky-200 bg-sky-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br ${style.avatarClass} text-xs font-bold text-white`}
                                >
                                  {getInitials(record.candidate)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {record.candidate}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {record.round}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badgeClass}`}
                              >
                                {record.score}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                              <span>{record.role}</span>
                              <span>{formatShortDate(record.date)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-[26px] bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Active interview
                          </p>
                          <h3 className="mt-2 text-[24px] font-bold text-slate-900">
                            {activeRecord.candidate}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${activeRoleStyle.pillClass}`}
                            >
                              {activeRecord.role}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {activeRecord.round}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {activeRecord.duration} min
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-5xl font-bold tracking-tight text-slate-900">
                            {activeRecord.score}
                          </p>
                          <span
                            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getOutcomeClass(
                              activeRecord.score
                            )}`}
                          >
                            {getOutcomeLabel(activeRecord.score)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Interviewer
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {activeRecord.interviewer}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Session date
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatShortDate(activeRecord.date)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Candidate growth
                          </p>
                          <p
                            className={`mt-2 text-sm font-semibold ${
                              candidateGrowth >= 0
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {candidateGrowth >= 0 ? "+" : ""}
                            {candidateGrowth} pts
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          AI feedback
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {activeRecord.feedback}
                        </p>
                        <p className="mt-4 text-sm font-semibold text-slate-900">
                          Next focus:
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {activeRecord.nextStep}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {activeRecord.focusTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Leaderboard
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Ranked from the current filter
                      </p>
                    </div>
                    <TrophyIcon className="h-6 w-6 text-amber-500" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {leaderboard.map((member) => (
                      <div
                        key={member.name}
                        className={`rounded-2xl border px-4 py-4 ${
                          member.rank === 1
                            ? "border-sky-200 bg-sky-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                              {member.rank}
                            </div>
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br ${member.avatarClass} text-xs font-bold text-white`}
                            >
                              {member.initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {member.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {member.role}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`rounded-full px-3 py-1 text-sm font-semibold ${member.badgeClass}`}
                            >
                              {member.score}
                            </span>
                            <p
                              className={`mt-2 text-xs font-semibold ${
                                member.delta >= 0
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {member.delta >= 0 ? "+" : ""}
                              {member.delta} pts
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Skill Graph
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Generated from the active interview record
                      </p>
                    </div>
                    <SparkIcon className="h-6 w-6 text-sky-600" />
                  </div>

                  <div className="mt-5 flex flex-col items-center">
                    <svg
                      viewBox="0 0 272 272"
                      className="h-82.5 w-full max-w-107.5"
                      role="img"
                      aria-label="Skill graph"
                    >
                      {rings.map((points, index) => (
                        <polygon
                          key={index}
                          points={points}
                          fill="none"
                          stroke="#dbeafe"
                          strokeWidth="1.2"
                        />
                      ))}

                      {graphPoints.map((item) => (
                        <line
                          key={item.label}
                          x1={center}
                          y1={center}
                          x2={item.axisPoint.x}
                          y2={item.axisPoint.y}
                          stroke="#dbeafe"
                          strokeWidth="1"
                        />
                      ))}

                      <polygon
                        points={polygonPoints}
                        fill="rgba(14, 165, 233, 0.18)"
                        stroke="#0284c7"
                        strokeWidth="2"
                      />

                      {graphPoints.map((item) => (
                        <g key={item.label}>
                          <circle
                            cx={item.valuePoint.x}
                            cy={item.valuePoint.y}
                            r="4"
                            fill="#0284c7"
                          />
                          <text
                            x={item.labelPoint.x}
                            y={item.labelPoint.y}
                            fontSize="11"
                            fill="#475569"
                            textAnchor={
                              item.labelPoint.x < center - 16
                                ? "end"
                                : item.labelPoint.x > center + 16
                                  ? "start"
                                  : "middle"
                            }
                          >
                            {`${item.label}: ${item.value}`}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Skill Breakdown
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Metric bars pulled from the active session
                      </p>
                    </div>
                    <StatsIcon className="h-6 w-6 text-indigo-500" />
                  </div>

                  <div className="mt-6 space-y-5">
                    {skillMetrics.map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.value}%
                          </p>
                        </div>

                        <div className="mt-3 h-3 rounded-full bg-slate-100">
                          <div
                            className={`h-3 rounded-full ${item.tone}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Interview Trend
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Previous sessions for {activeRecord.candidate}
                      </p>
                    </div>
                    <TrendUpIcon className="h-6 w-6 text-emerald-500" />
                  </div>

                  <div className="mt-6 rounded-[26px] bg-slate-50 p-5">
                    <svg
                      viewBox="0 0 360 150"
                      className="h-47.5 w-full"
                      role="img"
                      aria-label="Interview trend chart"
                    >
                      <line x1="28" y1="128" x2="332" y2="128" stroke="#e2e8f0" />
                      <path d={`M ${trendArea}`} fill="rgba(14,165,233,0.08)" />
                      <polyline
                        points={trendPolyline}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {trendPoints.map((point) => (
                        <g key={point.id}>
                          <circle cx={point.x} cy={point.y} r="4" fill="#0284c7" />
                          <text
                            x={point.x}
                            y="144"
                            fontSize="11"
                            textAnchor="middle"
                            fill="#64748b"
                          >
                            {formatShortDate(point.date)}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        First
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {firstCandidateScore}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Growth
                      </p>
                      <p
                        className={`mt-2 text-2xl font-bold ${
                          candidateGrowth >= 0
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }`}
                      >
                        {candidateGrowth >= 0 ? "+" : ""}
                        {candidateGrowth}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Sessions
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {candidateRecords.length}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-7">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Interview Round Performance
                      </h2>
                      <div className="mt-2 flex items-center gap-5 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm bg-sky-600" />
                          Qualified
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm bg-sky-200" />
                          Needs review
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                      onClick={() => alert("By Round Filter Clicked")}
                    >
                      By round
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                    <div className="flex h-72 flex-col justify-between pb-7 text-xs font-medium text-slate-400">
                      {roundTicks.map((tick, index) => (
                        <span key={`${tick}-${index}`}>{tick}</span>
                      ))}
                    </div>

                    <div
                      className="relative h-72 rounded-[26px] px-4 pb-2 pt-3"
                      style={{
                        backgroundColor: "#ffffff",
                        backgroundImage:
                          "linear-gradient(to top, rgba(226,232,240,0.7) 1px, transparent 1px)",
                        backgroundSize: "100% 25%",
                      }}
                    >
                      <div className="relative flex h-full items-end justify-between gap-5">
                        {roundPerformance.map((item) => {
                          const passHeight = (item.pass / roundScaleMax) * 100;
                          const reviewHeight = (item.review / roundScaleMax) * 100;

                          return (
                            <div
                              key={item.label}
                              className="flex flex-1 flex-col items-center justify-end gap-3"
                            >
                              <div className="flex h-[88%] w-full max-w-18 flex-col justify-end overflow-hidden rounded-t-[22px]">
                                <div
                                  className="bg-sky-200"
                                  style={{ height: `${reviewHeight}%` }}
                                />
                                <div
                                  className="bg-sky-600"
                                  style={{ height: `${passHeight}%` }}
                                />
                              </div>
                              <span className="text-center text-xs font-semibold text-slate-500">
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm xl:col-span-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[24px] font-bold text-slate-900">
                        Role Readiness
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Averaged from all mock interview records
                      </p>
                    </div>
                    <UsersIcon className="h-6 w-6 text-sky-600" />
                  </div>

                  <div className="mt-6 space-y-4">
                    {roleReadiness.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-slate-700">
                            {item.label}
                          </span>
                          <span className="text-slate-400">{item.score}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div
                            className={`h-3 rounded-full ${item.tone}`}
                            style={{ width: item.width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {roleReadiness.map((item) => (
                      <div
                        key={`${item.label}-legend`}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          {item.label}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${item.badgeClass}`}
                        >
                          {item.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function LogoIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="2.8" />
      <circle cx="12" cy="12" r="7.2" />
      <path d="M6 8.5c1.5-1.6 3.6-2.5 6-2.5s4.5.9 6 2.5" />
      <path d="M6 15.5c1.5 1.6 3.6 2.5 6 2.5s4.5-.9 6-2.5" />
    </svg>
  );
}

function GridIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function TrophyIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
      <path d="M9 18h6" />
      <path d="M12 11v7" />
      <path d="M6 5H4.5A1.5 1.5 0 0 0 3 6.5V7a4 4 0 0 0 4 4" />
      <path d="M18 5h1.5A1.5 1.5 0 0 1 21 6.5V7a4 4 0 0 1-4 4" />
    </svg>
  );
}

function FileIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M8 3.5h5.5L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6.5 20V5A1.5 1.5 0 0 1 8 3.5Z" />
      <path d="M13.5 3.5V8h5" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function UsersIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M16.5 20a4.5 4.5 0 0 0-9 0" />
      <circle cx="12" cy="9" r="3.2" />
      <path d="M19.7 19.5a3.8 3.8 0 0 0-3-3.7" />
      <path d="M17.2 6.2a3.2 3.2 0 0 1 0 5.6" />
    </svg>
  );
}

function StatsIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="4" y="11" width="3" height="8" rx="1" />
      <rect x="10.5" y="7" width="3" height="12" rx="1" />
      <rect x="17" y="4" width="3" height="15" rx="1" />
    </svg>
  );
}

function SettingsIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 8.7A3.3 3.3 0 1 0 12 15.3A3.3 3.3 0 1 0 12 8.7Z" />
      <path d="M19.4 13.1a1 1 0 0 0 .2 1.1l.1.1a1.5 1.5 0 0 1-1 2.6l-.1.1a1 1 0 0 0-.8.8 1.5 1.5 0 0 1-2.6 1l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.5 1.5 0 0 1-3 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.5 1.5 0 0 1-2.6-1l-.1-.1a1 1 0 0 0-.8-.8 1.5 1.5 0 0 1-1-2.6l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.5 1.5 0 0 1 0-3h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.5 1.5 0 0 1 1-2.6l.1-.1a1 1 0 0 0 .8-.8 1.5 1.5 0 0 1 2.6-1l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1.5 1.5 0 0 1 3 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.5 1.5 0 0 1 2.6 1l.1.1a1 1 0 0 0 .8.8 1.5 1.5 0 0 1 1 2.6l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.1a1.5 1.5 0 0 1 0 3h-.1a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function SearchIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BellIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M15.5 17.5h-7l1.1-1.8V11a3.9 3.9 0 0 1 7.8 0v4.7l1.1 1.8Z" />
      <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SidebarToggleIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M6 6v12" />
      <path d="M10 7.5 8 9.8 10 12" />
      <path d="M18 6v12" />
    </svg>
  );
}

function SparkIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m18.5 15 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8 0.8-2.2Z" />
    </svg>
  );
}

function FeedbackIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v5.5A1.5 1.5 0 0 1 17.5 20h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H11" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function BrowserPanelIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M10 5v14" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m14 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m10 6 6 6-6 6" />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="6" y="10" width="12" height="10" rx="2" />
      <path d="M9 10V8a3 3 0 1 1 6 0v2" />
    </svg>
  );
}

function RefreshIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M20 11a8 8 0 1 0 2.1 5.4" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10v5" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function ShareIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M13 5h6v6" />
      <path d="M10 14 19 5" />
      <path d="M19 13v5.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6H12" />
    </svg>
  );
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CopyIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="8" y="8" width="11" height="12" rx="2" />
      <path d="M5 16V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function AdjustmentsIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 7h8" />
      <path d="M16 7h4" />
      <path d="M9 17h11" />
      <path d="M4 17h1" />
      <circle cx="14" cy="7" r="2" />
      <circle cx="7" cy="17" r="2" />
    </svg>
  );
}

function LightningIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m13 2-7 10h5l-1 10 8-12h-5l0-8Z" />
    </svg>
  );
}

function WandIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m4 20 8.5-8.5" />
      <path d="m10.5 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
      <path d="m16.5 10 0.8-1.6L19 7.6l-1.7-0.8L16.5 5l-0.8 1.8L14 7.6l1.7 0.8 0.8 1.6Z" />
      <path d="M6.5 17.5 4 20" />
    </svg>
  );
}

function ReplayIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M7 7H3v4" />
      <path d="M3 11a8 8 0 1 0 2.3-5.6L7 7" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function TrendUpIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 16 10 10l4 4 6-7" />
      <path d="M20 11V7h-4" />
    </svg>
  );
}
