export const roleStyles = {
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

export const average = (items, selector) =>
  items.length
    ? Math.round(items.reduce((sum, item) => sum + selector(item), 0) / items.length)
    : 0;

export const getInitials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const formatShortDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const getOutcomeLabel = (score) => {
  if (score >= 85) return "Strong Hire";
  if (score >= 78) return "On Track";
  return "Needs Coaching";
};

export const getOutcomeClass = (score) => {
  if (score >= 85) return "bg-emerald-100 text-emerald-700";
  if (score >= 78) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
};

export const buildLeaderboard = (records) => {
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
    .slice(0, 100)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

export const buildRoleReadiness = (records) => {
  const grouped = records.reduce((accumulator, record) => {
    if (!accumulator[record.role]) accumulator[record.role] = [];
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

export const buildRoundPerformance = (records) => {
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

export const pointFromAngle = (angle, radius, center) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
};
