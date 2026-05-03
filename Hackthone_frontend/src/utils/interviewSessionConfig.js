const TECHNICAL_SKILL_PATTERNS = [
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\bpython\b/i,
  /\bjava\b/i,
  /\breact\b/i,
  /\bredux\b/i,
  /\bnode\b/i,
  /\bexpress\b/i,
  /\bhtml\b/i,
  /\bcss\b/i,
  /\bsql\b/i,
  /\bdatabase\b/i,
  /\bcloud\b/i,
  /\baws\b/i,
  /\bazure\b/i,
  /\bdocker\b/i,
  /\bkubernetes\b/i,
  /\bsystem design\b/i,
  /\bdata structures?\b/i,
  /\balgorithms?\b/i,
  /\bapi\b/i,
  /\bdevops\b/i,
  /\bmachine learning\b/i,
  /\bmlops\b/i,
  /\bperformance\b/i,
  /\bsecurity\b/i,
  /\boperating systems?\b/i,
  /\bcomputer networks?\b/i,
  /\bredis\b/i,
  /\bmongo\b/i,
  /\bpostgres\b/i,
  /\bmysql\b/i,
  /\bfigma\b/i,
  /\btesting\b/i,
  /\bjest\b/i,
  /\bci\/cd\b/i,
  /\bspring\b/i,
  /\bterraform\b/i,
  /\bgit\b/i,
  /\brest\b/i,
  /\bgraphql\b/i,
  /\bfrontend\b/i,
  /\bbackend\b/i,
  /\bfull[- ]?stack\b/i,
];

const cleanText = (value = "") => String(value).replace(/\s+/g, " ").trim();

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/,|;|\||\n/)
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  return [];
};

const uniqueList = (values = []) =>
  values.reduce((items, value) => {
    const normalizedValue = cleanText(value);

    if (
      normalizedValue &&
      !items.some((item) => item.toLowerCase() === normalizedValue.toLowerCase())
    ) {
      items.push(normalizedValue);
    }

    return items;
  }, []);

const matchesAnyPattern = (value, patterns = []) =>
  patterns.some((pattern) => pattern.test(value));

const isTechnicalValue = (value = "") => {
  const normalizedValue = cleanText(value);
  return normalizedValue && matchesAnyPattern(normalizedValue, TECHNICAL_SKILL_PATTERNS);
};

const inferRound = (mode, item = {}) => {
  if (mode === "hr") {
    return "hr";
  }

  if (mode === "technical") {
    return "technical";
  }

  const descriptor = cleanText(`${item.title || ""} ${item.category || ""}`).toLowerCase();

  if (
    /behavioral|hr|leadership|salary|teamwork|conflict|company fit|goals|self assessment|self introduction/.test(
      descriptor,
    )
  ) {
    return "hr";
  }

  if (/product management|product\b/.test(descriptor)) {
    return "managerial";
  }

  return "technical";
};

const inferDomain = (mode, item = {}) => {
  if (mode === "hr") {
    return "general";
  }

  const descriptor = cleanText(
    `${item.title || ""} ${item.category || ""} ${normalizeList(item.topics).join(" ")}`,
  ).toLowerCase();

  if (/frontend|react|css|html|ui|browser/.test(descriptor)) {
    return "frontend";
  }

  if (
    /backend|node|express|java|spring|database|sql|api|cloud|devops|system design|microservices|distributed/.test(
      descriptor,
    )
  ) {
    return "backend";
  }

  return "general";
};

const inferCompany = ({ mode, item = {}, isCompanyRound = false, round = "technical" }) => {
  if (isCompanyRound || item.logo || item.emoji) {
    return cleanText(item.title) || "Service Companies";
  }

  if (round === "managerial") {
    return "Startup";
  }

  if (round === "hr") {
    return "Service Companies";
  }

  return mode === "mock" ? "Startup" : "Service Companies";
};

const buildTechnicalSkills = (item = {}) =>
  uniqueList([
    ...normalizeList(item.skills),
    ...normalizeList(item.topics),
  ]).filter((value) => isTechnicalValue(value));

const buildFocusAreas = (item = {}) =>
  uniqueList([
    ...normalizeList(item.topics),
    ...normalizeList(item.skills),
  ]);

const difficultyLabelForMode = (mode) => {
  if (mode === "hr") {
    return "Beginner";
  }

  if (mode === "technical") {
    return "Intermediate";
  }

  return "Medium";
};

export function buildInterviewConfig({ mode = "mock", item = {}, isCompanyRound = false }) {
  const round = inferRound(mode, item);
  const domain = inferDomain(mode, item);
  const company = inferCompany({ mode, item, isCompanyRound, round });
  const skills = round === "technical" ? buildTechnicalSkills(item) : [];
  const focus = buildFocusAreas(item);

  return {
    title: cleanText(item.title) || "Interview Session",
    duration: cleanText(item.duration) || "45 mins",
    questions: Number(item.questions) || 8,
    difficulty: cleanText(item.difficulty) || difficultyLabelForMode(mode),
    description:
      cleanText(item.description) || "AI-guided interview practice tailored to your track.",
    category: cleanText(item.category) || cleanText(mode) || "Interview",
    company,
    round,
    domain,
    skills,
    focus,
    isCompanyRound,
    mode,
  };
}

export function buildFallbackInterviewConfig(mode = "mock") {
  if (mode === "technical") {
    return buildInterviewConfig({
      mode,
      item: {
        title: "Technical Interview",
        duration: "45 mins",
        questions: 8,
        difficulty: "Intermediate",
        description: "Backend-connected technical interview practice.",
        category: "Technical",
        topics: ["JavaScript", "APIs", "Performance"],
        skills: ["JavaScript", "APIs", "Performance"],
      },
    });
  }

  if (mode === "hr") {
    return buildInterviewConfig({
      mode,
      item: {
        title: "HR Interview",
        duration: "30 mins",
        questions: 8,
        difficulty: "Beginner",
        description: "Backend-connected HR and behavioral interview practice.",
        category: "HR",
        topics: ["Tell me about yourself", "Strengths", "Teamwork"],
      },
    });
  }

  return buildInterviewConfig({
    mode,
    item: {
      title: "Interview Session",
      duration: "45 mins",
      questions: 8,
      difficulty: "Medium",
      description: "Backend-connected adaptive interview practice.",
      category: "Mock",
      topics: ["JavaScript", "State Management", "Performance"],
      skills: ["JavaScript", "State Management", "Performance"],
    },
  });
}

export function mergeResumeIntoInterviewConfig(config = {}, parsedResume = null) {
  if (!parsedResume || config.round !== "technical") {
    return config;
  }

  const resumeSkills = uniqueList([
    ...normalizeList(parsedResume.languages),
    ...normalizeList(parsedResume.frameworks),
    ...normalizeList(parsedResume.tools),
  ]).filter((value) => isTechnicalValue(value));
  const resumeFocus = uniqueList(normalizeList(parsedResume.concepts));

  return {
    ...config,
    skills: uniqueList([...(config.skills || []), ...resumeSkills]),
    focus: uniqueList([...(config.focus || []), ...resumeFocus]),
  };
}

export function buildInterviewRequestPayload(config = {}, overrides = {}) {
  const payload = {
    company: cleanText(overrides.company || config.company),
    round: cleanText(overrides.round || config.round) || "technical",
    domain: cleanText(overrides.domain || config.domain) || "general",
    difficulty: cleanText(overrides.difficulty || config.difficulty) || "medium",
    title: cleanText(overrides.title || config.title),
    category: cleanText(overrides.category || config.category),
    mode: cleanText(overrides.mode || config.mode),
    responseMode: cleanText(overrides.responseMode || config.responseMode) || "text",
    questionTarget: Number(overrides.questionTarget || config.questionTarget || config.questions) || 8,
    ...(cleanText(overrides.resumeFileName || config.resumeFileName)
      ? { resumeFileName: cleanText(overrides.resumeFileName || config.resumeFileName) }
      : {}),
    ...(cleanText(overrides.resumeParser || config.resumeParser)
      ? { resumeParser: cleanText(overrides.resumeParser || config.resumeParser) }
      : {}),
    ...(overrides.resumeSkills || config.resumeSkills
      ? {
          resumeSkills: {
            languages: uniqueList((overrides.resumeSkills || config.resumeSkills)?.languages || []),
            frameworks: uniqueList((overrides.resumeSkills || config.resumeSkills)?.frameworks || []),
            tools: uniqueList((overrides.resumeSkills || config.resumeSkills)?.tools || []),
            concepts: uniqueList((overrides.resumeSkills || config.resumeSkills)?.concepts || []),
          },
        }
      : {}),
    ...(overrides.sessionId ? { sessionId: cleanText(overrides.sessionId) } : {}),
    ...(overrides.reset ? { reset: true } : {}),
  };

  const skills = uniqueList(overrides.skills || config.skills || []);
  const focus = uniqueList(overrides.focus || config.focus || []);

  if (skills.length > 0) {
    payload.skills = skills;
  }

  if (focus.length > 0) {
    payload.focus = focus;
  }

  return payload;
}
