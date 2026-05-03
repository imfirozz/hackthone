import {
  GridIcon,
  FileIcon,
  UsersIcon,
  TrophyIcon,
  StatsIcon,
  SettingsIcon,
  LightningIcon,
  WandIcon,
  ReplayIcon,
  HomeIcon,
} from "./Icons";
import { roleStyles, getInitials } from "./utils";

export const navItems = [
  { label: "Home", icon: HomeIcon, active: false, path: "/" },
  { label: "Dashboard", icon: GridIcon, active: true, path: "/dashboard" },
  { label: "Interviews", icon: FileIcon, active: false, path: "/interviews" },
  { label: "Candidates", icon: UsersIcon, active: false, path: "/candidates" },
  { label: "Leaderboard", icon: TrophyIcon, active: false, path: "/leaderboard" },
  { label: "Analytics", icon: StatsIcon, active: false, path: "/analytics" },
  { label: "Settings", icon: SettingsIcon, active: false, path: "/settings" },
];

export const aiShortcuts = [
  {
    title: "Smart feedback for your next round",
    detail: "Surface the one response pattern that needs attention before the next mock.",
    icon: LightningIcon,
    path: "/feature/smart-feedback",
  },
  {
    title: "Turn raw answers into high-signal interview responses",
    detail: "Restructure vague answers into concise, recruiter-friendly talking points.",
    icon: WandIcon,
    path: "/feature/restructure",
  },
  {
    title: "Revisit previous interviews with AI feedback",
    detail: "Compare older sessions with current scores and see if the coaching is working.",
    icon: ReplayIcon,
    path: "/feature/revisit",
  },
];

export const skillMeta = [
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

const firstNames = [
  "Aarav", "Meera", "Rohan", "Kavya", "Dev", "Priya", "Aditya", "Neha", "Vikram", "Ananya",
  "Rahul", "Sneha", "Amit", "Pooja", "Raj", "Riya", "Sanjay", "Anjali", "Karan", "Kirti",
  "Arjun", "Simran", "Vikas", "Tanvi", "Siddharth", "Aisha", "Gaurav", "Nisha", "Manish", "Divya",
  "Saurabh", "Ritu", "Deepak", "Shruti", "Tarun", "Aarti", "Nitin", "Payal", "Prashant", "Shikha",
  "Alok", "Monika", "Yash", "Swati", "Naveen", "Jyoti", "Harish", "Richa", "Vishal", "Sonam",
];

const lastNames = [
  "Singh", "Patel", "Das", "Iyer", "Malhotra", "Sharma", "Rao", "Gupta", "Verma", "Reddy",
  "Kumar", "Mehta", "Bose", "Jain", "Nair", "Yadav", "Chauhan", "Bhatia", "Kapoor", "Chatterjee",
  "Menon", "Joshi", "Saxena", "Desai", "Pandey",
];

const roleProfiles = {
  "Frontend Developer": {
    baseScore: 66,
    skillBias: { communication: 2, technical: 2, confidence: 1, problemSolving: 1, systemDesign: -3, delivery: 3 },
    focusTags: ["React", "Accessibility", "State Management", "UI Performance", "Design Systems"],
  },
  "Backend Developer": {
    baseScore: 67,
    skillBias: { communication: 0, technical: 4, confidence: 1, problemSolving: 3, systemDesign: 2, delivery: 0 },
    focusTags: ["API Design", "Databases", "Caching", "Observability", "Scalability"],
  },
  "Full Stack Developer": {
    baseScore: 65,
    skillBias: { communication: 1, technical: 3, confidence: 1, problemSolving: 2, systemDesign: 0, delivery: 1 },
    focusTags: ["Product Thinking", "React", "Node.js", "System Tradeoffs", "Deployment"],
  },
  "Java Developer": {
    baseScore: 64,
    skillBias: { communication: 0, technical: 3, confidence: 1, problemSolving: 2, systemDesign: 1, delivery: 0 },
    focusTags: ["Java", "Spring Boot", "Concurrency", "Microservices", "Testing"],
  },
  "Python Developer": {
    baseScore: 64,
    skillBias: { communication: 1, technical: 2, confidence: 0, problemSolving: 2, systemDesign: 1, delivery: 1 },
    focusTags: ["Python", "Data Structures", "Flask", "Problem Solving", "Automation"],
  },
};

const roundSequence = [
  "Mock Interview",
  "Technical Interview",
  "HR Interview",
  "Technical Interview",
  "Mock Interview",
  "HR Interview",
  "Technical Interview",
  "Mock Interview",
];

const sessionOffsets = [112, 95, 79, 63, 46, 31, 17, 6];

const roundDurationBase = {
  "Mock Interview": 27,
  "Technical Interview": 39,
  "HR Interview": 24,
};

const roundSkillAdjustments = {
  "Mock Interview": { communication: 2, technical: -1, confidence: 1, problemSolving: 0, systemDesign: -1, delivery: 2 },
  "Technical Interview": { communication: 0, technical: 3, confidence: 0, problemSolving: 3, systemDesign: 2, delivery: 0 },
  "HR Interview": { communication: 3, technical: -2, confidence: 2, problemSolving: 0, systemDesign: -2, delivery: 3 },
};

const interviewerPools = {
  "Mock Interview": ["AIX Recruiter Bot", "AIX Hiring Coach"],
  "Technical Interview": ["AIX Senior Engineer", "AIX Architecture Board"],
  "HR Interview": ["AIX People Team", "AIX Culture Panel"],
};

const roundFocusTag = {
  "Mock Interview": "Storytelling",
  "Technical Interview": "Architecture",
  "HR Interview": "Behavioral",
};

const improvementCurve = [0, 4, 7, 10, 13, 15, 18, 21];
const roleOrder = Object.keys(roleProfiles);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toIsoDate = (daysAgo) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - Math.max(daysAgo, 0));
  return d.toISOString().slice(0, 10);
};

const getScoreBandMessage = (score) => {
  if (score >= 87) {
    return "Offer-ready performance with strong evidence-backed examples.";
  }
  if (score >= 78) {
    return "Solid session with good structure, but one or two follow-ups need sharper detail.";
  }
  return "Foundational clarity is there, but responses need stronger ownership and measurable outcomes.";
};

const buildFeedback = ({ score, weakestSkillLabel, role }) =>
  `${getScoreBandMessage(score)} Biggest opportunity is ${weakestSkillLabel.toLowerCase()} for ${role.toLowerCase()} interviews.`;

const buildNextStep = ({ weakestSkillLabel, round }) =>
  `Before the next ${round.toLowerCase()}, prepare one STAR story focused on improving ${weakestSkillLabel.toLowerCase()}.`;

const buildMockRecords = () => {
  const records = [];
  const totalCandidates = 45;
  let idCounter = 1;

  for (let candidateIndex = 0; candidateIndex < totalCandidates; candidateIndex += 1) {
    const role = roleOrder[candidateIndex % roleOrder.length];
    const profile = roleProfiles[role];
    const candidate = `${firstNames[candidateIndex]} ${lastNames[(candidateIndex * 7) % lastNames.length]}`;
    const candidateVariance = (candidateIndex % 7) - 3;
    const dateShift = candidateIndex % 6;

    for (let sessionIndex = 0; sessionIndex < roundSequence.length; sessionIndex += 1) {
      const round = roundSequence[sessionIndex];
      const roundAdjustment = round === "Technical Interview" ? 2 : round === "HR Interview" ? -1 : 0;
      const volatility = ((candidateIndex + sessionIndex) % 3) - 1;
      const score = clamp(
        profile.baseScore + candidateVariance + improvementCurve[sessionIndex] + roundAdjustment + volatility,
        52,
        97
      );

      const skillValues = skillMeta.reduce((accumulator, skill) => {
        const roleBias = profile.skillBias[skill.key] || 0;
        const roundBias = roundSkillAdjustments[round][skill.key] || 0;
        const sessionLift = Math.floor(sessionIndex / 2);
        accumulator[skill.key] = clamp(score + roleBias + roundBias + sessionLift, 45, 99);
        return accumulator;
      }, {});

      const weakestSkill = skillMeta.reduce((lowest, skill) => {
        if (!lowest || skillValues[skill.key] < skillValues[lowest.key]) {
          return skill;
        }
        return lowest;
      }, null);

      const interviewerList = interviewerPools[round];
      const interviewer = interviewerList[(candidateIndex + sessionIndex) % interviewerList.length];
      const duration = roundDurationBase[round] + (candidateIndex % 4) + (sessionIndex % 3) - 1;
      const roleTag = profile.focusTags[(candidateIndex + sessionIndex) % profile.focusTags.length];
      const focusTags = [roleTag, roundFocusTag[round], weakestSkill.label]
        .filter((tag, idx, arr) => arr.indexOf(tag) === idx)
        .slice(0, 3);

      records.push({
        id: `aix-${idCounter.toString().padStart(4, "0")}`,
        candidate,
        role,
        round,
        interviewer,
        date: toIsoDate(sessionOffsets[sessionIndex] - dateShift),
        duration,
        score,
        communication: skillValues.communication,
        technical: skillValues.technical,
        confidence: skillValues.confidence,
        problemSolving: skillValues.problemSolving,
        systemDesign: skillValues.systemDesign,
        delivery: skillValues.delivery,
        feedback: buildFeedback({ score, weakestSkillLabel: weakestSkill.label, role }),
        nextStep: buildNextStep({ weakestSkillLabel: weakestSkill.label, round }),
        focusTags,
      });

      idCounter += 1;
    }
  }

  return records;
};

export const interviewRecords = buildMockRecords();

const candidateScores = {};

interviewRecords.forEach((record) => {
  if (!candidateScores[record.candidate]) {
    candidateScores[record.candidate] = {
      name: record.candidate,
      role: record.role,
      totalScore: 0,
      count: 0,
      firstScore: record.score,
      lastScore: record.score,
      firstDate: record.date,
      lastDate: record.date,
      initials: getInitials(record.candidate),
      avatarClass: roleStyles[record.role]?.avatarClass || "from-slate-400 to-slate-500",
    };
  }

  const entry = candidateScores[record.candidate];
  entry.totalScore += record.score;
  entry.count += 1;

  if (new Date(record.date) < new Date(entry.firstDate)) {
    entry.firstDate = record.date;
    entry.firstScore = record.score;
  }

  if (new Date(record.date) > new Date(entry.lastDate)) {
    entry.lastDate = record.date;
    entry.lastScore = record.score;
    entry.role = record.role;
  }
});

export const leaderboard = Object.values(candidateScores)
  .map((candidateEntry) => ({
    ...candidateEntry,
    score: Math.round(candidateEntry.totalScore / candidateEntry.count),
    delta: candidateEntry.lastScore - candidateEntry.firstScore,
  }))
  .sort((left, right) => right.score - left.score)
  .slice(0, 100)
  .map((candidateEntry, index) => ({
    ...candidateEntry,
    rank: index + 1,
  }));
