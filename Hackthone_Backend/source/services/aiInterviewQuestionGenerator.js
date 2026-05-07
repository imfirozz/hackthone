const { getApiKeyManager } = require("../config/apiKeyManager");

const GEMINI_MODEL = "gemini-2.5-flash";

const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

const stripCodeFence = (value = "") =>
  value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const extractJsonPayload = (value = "") => {
  const strippedValue = stripCodeFence(value);
  const firstBraceIndex = strippedValue.indexOf("{");
  const lastBraceIndex = strippedValue.lastIndexOf("}");

  if (
    firstBraceIndex === -1 ||
    lastBraceIndex === -1 ||
    lastBraceIndex < firstBraceIndex
  ) {
    return strippedValue;
  }

  return strippedValue.slice(firstBraceIndex, lastBraceIndex + 1);
};

const parseJsonPayload = (value = "") => JSON.parse(extractJsonPayload(value));

const normalizeDifficulty = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (["beginner", "basic", "easy"].includes(normalizedValue)) {
    return "easy";
  }

  if (["intermediate", "medium"].includes(normalizedValue)) {
    return "medium";
  }

  if (["advanced", "hard", "senior"].includes(normalizedValue)) {
    return "hard";
  }

  return normalizedValue || "medium";
};

const normalizeRound = (value = "") => {
  const normalizedValue = cleanText(value).toLowerCase();

  if (normalizedValue.includes("hr")) {
    return "hr";
  }

  if (normalizedValue.includes("manager")) {
    return "managerial";
  }

  return "technical";
};

const normalizeCompany = (value = "") => cleanText(value).toLowerCase();

const LIST_SPLIT_PATTERN = /,|;|\||\n|\s\/\s/;

const splitNormalizedInput = (value = "") =>
  String(value)
    .split(LIST_SPLIT_PATTERN)
    .map((item) => cleanText(item))
    .filter(Boolean);

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitNormalizedInput(item));
  }

  if (typeof value === "string") {
    return splitNormalizedInput(value);
  }

  return [];
};

const NON_TECHNICAL_SKILL_PATTERNS = [
  /\bcommunication\b/i,
  /\bteamwork\b/i,
  /\bcollaboration\b/i,
  /\bleadership\b/i,
  /\badaptability\b/i,
  /\bcritical thinking\b/i,
  /\btime management\b/i,
  /\bself[- ]?motivated\b/i,
  /\bquick learner\b/i,
  /\bhard[- ]?working\b/i,
  /\binterpersonal\b/i,
  /\bproblem solving\b/i,
  /\bdecision making\b/i,
  /\bfrontend\b/i,
  /\bbackend\b/i,
  /\bfull[- ]?stack\b/i,
  /\bdeveloper\b/i,
  /\bengineer\b/i,
  /\bstudent\b/i,
  /\bintern\b/i,
  /\benglish\b/i,
  /\bhindi\b/i,
];

const TECHNICAL_SKILL_PATTERNS = [
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\bpython\b/i,
  /\bjava\b/i,
  /\brust\b/i,
  /\bphp\b/i,
  /\bruby\b/i,
  /\bkotlin\b/i,
  /\bswift\b/i,
  /\bdart\b/i,
  /\bgo(?:lang)?\b/i,
  /\bsql\b/i,
  /\bbash\b/i,
  /\bc\+\+\b/i,
  /\bc#\b/i,
  /\bhtml(?:5)?\b/i,
  /\bcss(?:3)?\b/i,
  /\breact(?:\.js|js)?\b/i,
  /\breact router(?: dom)?\b/i,
  /\breact-router(?:-dom)?\b/i,
  /\bnext(?:\.js|js)?\b/i,
  /\bnode(?:\.js|js)?\b/i,
  /\bexpress(?:\.js|js)?\b/i,
  /\bangular\b/i,
  /\bvue(?:\.js|js)?\b/i,
  /\bnuxt(?:\.js|js)?\b/i,
  /\bnest(?:\.js|js)?\b/i,
  /\bnestjs\b/i,
  /\bredux toolkit\b/i,
  /\bredux\b/i,
  /\btailwind(?:\s+css)?\b/i,
  /\bbootstrap\b/i,
  /\bmaterial ui\b/i,
  /\bmui\b/i,
  /\bspring boot\b/i,
  /\bdjango\b/i,
  /\bflask\b/i,
  /\bfastapi\b/i,
  /\bfast api\b/i,
  /\breact native\b/i,
  /\bflutter\b/i,
  /\basp\.net\b/i,
  /\blaravel\b/i,
  /\bgit(?:hub|lab)?\b/i,
  /\bpostman\b/i,
  /\bdocker\b/i,
  /\bkubernetes\b/i,
  /\bk8s\b/i,
  /\bjenkins\b/i,
  /\baws\b/i,
  /\bamazon web services\b/i,
  /\bazure\b/i,
  /\bgcp\b/i,
  /\bgoogle cloud\b/i,
  /\bmongo\s*db\b/i,
  /\bmongodb\b/i,
  /\bmysql\b/i,
  /\bpostgres(?:ql)?\b/i,
  /\bredis\b/i,
  /\bfirebase\b/i,
  /\bsupabase\b/i,
  /\blinux\b/i,
  /\bfigma\b/i,
  /\bvercel\b/i,
  /\bnetlify\b/i,
  /\bnpm\b/i,
  /\byarn\b/i,
  /\bparcel\b/i,
  /\bwebpack\b/i,
  /\bbabel\b/i,
  /\bjira\b/i,
  /\bvs\.?\s*code\b/i,
  /\bvisual studio code\b/i,
  /\bdata structures?\b/i,
  /\balgorithms?\b/i,
  /\boop\b/i,
  /\bobject[- ]oriented programming\b/i,
  /\bdbms\b/i,
  /\boperating systems?\b/i,
  /\bcomputer networks?\b/i,
  /\brest(?:ful)?\s*apis?\b/i,
  /\bgraphql\b/i,
  /\bapi integrations?\b/i,
  /\bresponsive design\b/i,
  /\bstate management\b/i,
  /\bmachine learning\b/i,
  /\bsystem design\b/i,
  /\bmicroservices?\b/i,
  /\bci\/cd\b/i,
  /\bcontinuous integration\b/i,
  /\bauthentication\b/i,
  /\bauthorization\b/i,
  /\bmvc\b/i,
  /\bunit tests?\b/i,
  /\bintegration tests?\b/i,
  /\bcaching\b/i,
  /\bsecurity\b/i,
  /\bperformance\b/i,
  /\bscalability\b/i,
];

const isTechnicalSkill = (value = "") => {
  const normalizedValue = cleanText(value);

  if (!normalizedValue) {
    return false;
  }

  if (
    NON_TECHNICAL_SKILL_PATTERNS.some((pattern) =>
      pattern.test(normalizedValue),
    )
  ) {
    return false;
  }

  return TECHNICAL_SKILL_PATTERNS.some((pattern) =>
    pattern.test(normalizedValue),
  );
};

const analyzeSkills = (value) => {
  const rawSkills = normalizeList(value);
  const validSkills = [];
  const invalidSkills = [];

  for (const skill of rawSkills) {
    if (isTechnicalSkill(skill)) {
      if (
        !validSkills.some((item) => item.toLowerCase() === skill.toLowerCase())
      ) {
        validSkills.push(skill);
      }
      continue;
    }

    invalidSkills.push(skill);
  }

  return {
    rawSkills,
    validSkills,
    invalidSkills,
  };
};

const normalizeSkills = (value) => analyzeSkills(value).validSkills;
const normalizeFocusAreas = (value) => normalizeList(value);
const normalizeTone = (value = "") => cleanText(value);
const normalizeStyle = (value = "") => cleanText(value);
const normalizeDomain = (value = "") =>
  cleanText(value).toLowerCase() || "general";

const normalizeQuestion = (value) => {
  const data = value && typeof value === "object" ? value : {};

  return {
    question: cleanText(typeof data.question === "string" ? data.question : ""),
    difficulty: normalizeDifficulty(
      typeof data.difficulty === "string" ? data.difficulty : "",
    ),
    topic: cleanText(typeof data.topic === "string" ? data.topic : ""),
  };
};

const CROSS_CUTTING_FOCUS_AREAS = new Set([
  "performance",
  "scalability",
  "security",
  "maintainability",
  "reliability",
  "testing",
  "debugging",
  "observability",
  "accessibility",
  "caching",
  "latency",
  "availability",
  "cost",
]);

const buildTopicPool = ({ focusAreas, skills, round, domain }) => {
  const domainFallback =
    round === "hr"
      ? "communication"
      : round === "managerial"
        ? "leadership"
        : domain || "fundamentals";

  const normalizedFocusAreas = focusAreas.filter(Boolean);
  const nonCrossCuttingFocusAreas = normalizedFocusAreas.filter(
    (area) => !CROSS_CUTTING_FOCUS_AREAS.has(area.toLowerCase()),
  );
  const crossCuttingFocusAreas = normalizedFocusAreas.filter((area) =>
    CROSS_CUTTING_FOCUS_AREAS.has(area.toLowerCase()),
  );

  const primaryTopics = [
    ...new Set([...nonCrossCuttingFocusAreas, ...skills].filter(Boolean)),
  ];

  if (primaryTopics.length > 0) {
    return primaryTopics;
  }

  const secondaryTopics = [
    ...new Set([...crossCuttingFocusAreas].filter(Boolean)),
  ];

  if (secondaryTopics.length > 0) {
    return secondaryTopics;
  }

  return [domainFallback];
};

const pickTopic = ({
  focusAreas,
  skills,
  round,
  domain,
  preferredTopic,
  previousTopics = [],
  questionNumber = 1,
}) => {
  if (preferredTopic) {
    return preferredTopic;
  }

  const topicPool = buildTopicPool({ focusAreas, skills, round, domain });
  const normalizedPreviousTopics = previousTopics.map((topic) =>
    cleanText(topic).toLowerCase(),
  );
  const unseenTopics = topicPool.filter(
    (topic) => !normalizedPreviousTopics.includes(topic.toLowerCase()),
  );
  const activePool = unseenTopics.length > 0 ? unseenTopics : topicPool;

  if (activePool.length === 0) {
    return "fundamentals";
  }

  const safeQuestionNumber = Math.max(1, Number(questionNumber) || 1);
  return activePool[(safeQuestionNumber - 1) % activePool.length];
};

const getCompanyStyle = (company) => {
  if (company.includes("google")) {
    return "google";
  }

  if (company.includes("amazon")) {
    return "amazon";
  }

  if (company.includes("startup")) {
    return "startup";
  }

  if (
    company.includes("service") ||
    company.includes("tcs") ||
    company.includes("infosys") ||
    company.includes("wipro") ||
    company.includes("accenture") ||
    company.includes("cognizant")
  ) {
    return "service";
  }

  return "generic";
};

const formatList = (items = []) => {
  const values = items.filter(Boolean);

  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
};

const toSentenceStart = (value = "") => {
  const cleanedValue = cleanText(value);
  if (!cleanedValue) {
    return "";
  }

  return cleanedValue.charAt(0).toUpperCase() + cleanedValue.slice(1);
};

const getStableVariantOffset = (seed = "") => {
  const normalizedSeed = cleanText(seed);
  if (!normalizedSeed) {
    return 0;
  }

  return [...normalizedSeed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
};

const pickVariant = (questionNumber = 1, variants = [], variantSeed = "") => {
  if (variants.length === 0) {
    return "";
  }

  const safeQuestionNumber = Math.max(1, Number(questionNumber) || 1);
  const variantOffset = getStableVariantOffset(variantSeed);
  return variants[(safeQuestionNumber - 1 + variantOffset) % variants.length];
};

const dedupeList = (items = []) =>
  items.reduce((result, item) => {
    const cleanedItem = cleanText(item);
    const itemKey = cleanedItem.toLowerCase();

    if (
      !cleanedItem ||
      result.some((value) => value.toLowerCase() === itemKey)
    ) {
      return result;
    }

    result.push(cleanedItem);
    return result;
  }, []);

const buildScenarioLabel = ({
  domain,
  primarySkill,
  questionNumber,
  variantSeed,
  companyStyle,
}) => {
  const scopedSeed = `${variantSeed}|scenario|${domain}|${companyStyle}|${primarySkill}`;
  const frontendScenarios = [
    "a dashboard screen",
    "a multi-step checkout flow",
    "a data-heavy page",
    "an admin panel",
    "a settings screen",
  ];
  const backendScenarios = [
    "an API endpoint",
    "a notification service",
    "a background job",
    "an auth flow",
    "a data sync service",
  ];
  const generalScenarios = [
    "a customer-facing feature",
    "an internal workflow",
    "a shared product flow",
    "a team-owned system",
    "a product feature",
  ];

  const baseScenario =
    domain === "frontend"
      ? pickVariant(questionNumber, frontendScenarios, scopedSeed)
      : domain === "backend"
        ? pickVariant(questionNumber, backendScenarios, scopedSeed)
        : pickVariant(questionNumber, generalScenarios, scopedSeed);

  if (!primarySkill) {
    return baseScenario;
  }

  return `${baseScenario} built with ${primarySkill}`;
};

const buildFocusClause = (focusAreas = []) => {
  const visibleFocusAreas = dedupeList(focusAreas).slice(0, 3);
  const focusText = formatList(visibleFocusAreas);

  if (!focusText) {
    return { focusText: "", focusClause: "" };
  }

  if (visibleFocusAreas.length === 1) {
    return {
      focusText,
      focusClause: ` while keeping ${focusText} in view`,
    };
  }

  return {
    focusText,
    focusClause: ` while balancing ${focusText}`,
  };
};

const buildIssueSignal = ({
  focusAreas,
  domain,
  questionNumber,
  variantSeed,
}) => {
  const normalizedFocusAreas = dedupeList(focusAreas).map((area) =>
    area.toLowerCase(),
  );
  const scopedSeed = `${variantSeed}|issue|${domain}|${normalizedFocusAreas.join("|")}`;

  if (normalizedFocusAreas.some((area) => area.includes("performance"))) {
    return domain === "backend"
      ? pickVariant(
          questionNumber,
          [
            "latency starts spiking once traffic climbs",
            "response times jump under a modest traffic increase",
            "the service slows down as soon as usage picks up",
          ],
          scopedSeed,
        )
      : pickVariant(
          questionNumber,
          [
            "the screen starts lagging after a few fast interactions",
            "the UI becomes sluggish once the page fills with data",
            "users feel the page getting noticeably slower as they interact with it",
          ],
          scopedSeed,
        );
  }

  if (normalizedFocusAreas.some((area) => area.includes("state"))) {
    return pickVariant(
      questionNumber,
      [
        "different parts of the UI start showing stale data",
        "one part of the screen updates while another stays out of sync",
        "users keep seeing state drift between related views",
      ],
      scopedSeed,
    );
  }

  if (normalizedFocusAreas.some((area) => area.includes("security"))) {
    return pickVariant(
      questionNumber,
      [
        "a user briefly sees data that should belong to someone else",
        "the team finds a path that exposes data too broadly",
        "a permission bug shows up in a live customer flow",
      ],
      scopedSeed,
    );
  }

  if (normalizedFocusAreas.some((area) => area.includes("scal"))) {
    return pickVariant(
      questionNumber,
      [
        "traffic doubles and the system starts backing up",
        "a sudden usage spike exposes bottlenecks you did not see earlier",
        "the first growth jump starts stressing the design",
      ],
      scopedSeed,
    );
  }

  if (
    normalizedFocusAreas.some(
      (area) => area.includes("reliab") || area.includes("availability"),
    )
  ) {
    return pickVariant(
      questionNumber,
      [
        "requests begin failing intermittently in production",
        "the feature starts dropping requests in a way that is hard to reproduce",
        "the system becomes flaky under normal production traffic",
      ],
      scopedSeed,
    );
  }

  if (normalizedFocusAreas.some((area) => area.includes("access"))) {
    return pickVariant(
      questionNumber,
      [
        "keyboard users cannot finish the main flow",
        "screen-reader users get stuck halfway through the task",
        "the core flow works visually but breaks for assistive technology users",
      ],
      scopedSeed,
    );
  }

  if (domain === "backend") {
    return pickVariant(
      questionNumber,
      [
        "responses start coming back inconsistently under load",
        "the service behaves differently across similar requests",
        "production traffic starts exposing inconsistent API behavior",
      ],
      scopedSeed,
    );
  }

  if (domain === "frontend") {
    return pickVariant(
      questionNumber,
      [
        "the UI falls out of sync after a few quick updates",
        "users see the screen behave inconsistently after normal interactions",
        "the page starts showing stale or flickering data",
      ],
      scopedSeed,
    );
  }

  return pickVariant(
    questionNumber,
    [
      "the feature starts behaving inconsistently in production",
      "real users begin hitting issues the team did not see in testing",
      "the first production rollout exposes behavior that feels unstable",
    ],
    scopedSeed,
  );
};

const getQuestionStyle = ({
  companyStyle,
  questionNumber,
  previousQuestions = [],
  variantSeed = "",
}) => {
  const allowFollowUp =
    Number(questionNumber || 1) > 1 || previousQuestions.length > 0;
  const stylesByCompany = {
    google: allowFollowUp
      ? ["challenge", "direct", "debug", "follow-up", "scenario"]
      : ["challenge", "direct", "debug", "scenario"],
    amazon: allowFollowUp
      ? ["scenario", "debug", "challenge", "follow-up", "direct"]
      : ["scenario", "debug", "challenge", "direct"],
    startup: allowFollowUp
      ? ["scenario", "challenge", "debug", "follow-up", "direct"]
      : ["scenario", "challenge", "debug", "direct"],
    service: allowFollowUp
      ? ["direct", "scenario", "debug", "follow-up", "challenge"]
      : ["direct", "scenario", "debug", "challenge"],
    generic: allowFollowUp
      ? ["scenario", "direct", "debug", "challenge", "follow-up"]
      : ["scenario", "direct", "debug", "challenge"],
  };

  return pickVariant(
    questionNumber,
    stylesByCompany[companyStyle] || stylesByCompany.generic,
    `${variantSeed}|style|${companyStyle}`,
  );
};

const getCompanyClosingClause = ({
  companyStyle,
  difficulty,
  questionNumber,
  variantSeed,
}) => {
  const scopedSeed = `${variantSeed}|closing|${companyStyle}|${difficulty}`;

  if (companyStyle === "google") {
    return difficulty === "hard"
      ? pickVariant(
          questionNumber,
          [
            " before the failure modes surprise you",
            " once the clean answer stops looking obvious",
            " when the easy choice no longer feels safe",
          ],
          scopedSeed,
        )
      : difficulty === "easy"
        ? pickVariant(
            questionNumber,
            [
              " in a way you can justify clearly",
              " without hand-waving the reason",
              " so the choice feels grounded",
            ],
            scopedSeed,
          )
        : pickVariant(
            questionNumber,
            [
              " once the feature starts growing",
              " before the design gets harder to unwind",
              " when the team needs a reasoned choice",
            ],
            scopedSeed,
          );
  }

  if (companyStyle === "amazon") {
    return difficulty === "hard"
      ? pickVariant(
          questionNumber,
          [
            " before rollout turns into an operational problem",
            " without creating cleanup work for the team later",
            " before reliability starts slipping",
          ],
          scopedSeed,
        )
      : difficulty === "easy"
        ? pickVariant(
            questionNumber,
            [
              " on day one",
              " for the team right away",
              " in the first usable version",
            ],
            scopedSeed,
          )
        : pickVariant(
            questionNumber,
            [
              " without making delivery painful",
              " while keeping rollout practical",
              " before the team has to support it at scale",
            ],
            scopedSeed,
          );
  }

  if (companyStyle === "startup") {
    return difficulty === "hard"
      ? pickVariant(
          questionNumber,
          [
            " without boxing the team in later",
            " while still leaving room for the next version",
            " without creating rework you could have avoided",
          ],
          scopedSeed,
        )
      : difficulty === "easy"
        ? pickVariant(
            questionNumber,
            [
              " without building too much too early",
              " in a lean first pass",
              " before the feature grows up",
            ],
            scopedSeed,
          )
        : pickVariant(
            questionNumber,
            [
              " while keeping the first version lean",
              " without slowing a small team down",
              " before the quick solution becomes expensive",
            ],
            scopedSeed,
          );
  }

  if (companyStyle === "service") {
    return difficulty === "hard"
      ? pickVariant(
          questionNumber,
          [
            " before the team gets surprised by edge cases",
            " before a client-facing bug slips through",
            " without losing clarity in the implementation",
          ],
          scopedSeed,
        )
      : difficulty === "easy"
        ? pickVariant(
            questionNumber,
            [
              " in a way a teammate could pick up quickly",
              " with clear reasoning behind it",
              " without making the explanation messy",
            ],
            scopedSeed,
          )
        : pickVariant(
            questionNumber,
            [
              " with the kind of clarity another developer could follow",
              " without making the implementation harder than it needs to be",
              " while keeping the explanation clean",
            ],
            scopedSeed,
          );
  }

  return difficulty === "hard"
    ? pickVariant(
        questionNumber,
        [
          " before the edge cases pile up",
          " once the constraints start pulling in different directions",
          " before it becomes expensive to change",
        ],
        scopedSeed,
      )
    : difficulty === "easy"
      ? pickVariant(
          questionNumber,
          [
            " in a clear, grounded way",
            " without turning it into a textbook answer",
            " in a way that feels practical",
          ],
          scopedSeed,
        )
      : pickVariant(
          questionNumber,
          [
            " before the feature grows more complex",
            " without making the design messy",
            " in a way that still feels practical",
          ],
          scopedSeed,
        );
};

const getTopicUsagePhrase = (topic = "") => {
  const cleanedTopic = cleanText(topic);
  const normalizedTopic = cleanedTopic.toLowerCase();

  if (!cleanedTopic) {
    return "the current setup";
  }

  if (
    normalizedTopic.includes(".js") ||
    normalizedTopic.includes("react") ||
    normalizedTopic.includes("redux") ||
    normalizedTopic.includes("router") ||
    normalizedTopic.includes("node") ||
    normalizedTopic.includes("express") ||
    normalizedTopic.includes("toolkit") ||
    normalizedTopic.includes("parcel") ||
    normalizedTopic.includes("tailwind")
  ) {
    return `the way you're using ${cleanedTopic}`;
  }

  if (CROSS_CUTTING_FOCUS_AREAS.has(normalizedTopic)) {
    return `your approach to ${cleanedTopic}`;
  }

  return cleanedTopic;
};

const getTopicSetupPhrase = (topic = "") => {
  const cleanedTopic = cleanText(topic);

  if (!cleanedTopic) {
    return "your current setup";
  }

  return `your ${cleanedTopic} setup`;
};

const getContextDetails = ({
  topic,
  focusAreas,
  skills,
  domain,
  questionNumber,
  variantSeed,
  companyStyle,
}) => {
  const uniqueSkills = dedupeList(skills);
  const uniqueFocusAreas = dedupeList(focusAreas);
  const relatedSkills = uniqueSkills.filter(
    (skill) => skill.toLowerCase() !== topic.toLowerCase(),
  );
  const primarySkill = relatedSkills[0] || uniqueSkills[0] || "";
  const extraFocusAreas = uniqueFocusAreas.filter(
    (area) => area.toLowerCase() !== topic.toLowerCase(),
  );
  const { focusText, focusClause } = buildFocusClause(extraFocusAreas);
  const scenario = buildScenarioLabel({
    domain,
    primarySkill,
    questionNumber,
    variantSeed,
    companyStyle,
  });
  const issueSignal = buildIssueSignal({
    focusAreas: extraFocusAreas,
    domain,
    questionNumber,
    variantSeed,
  });

  return {
    scenario,
    focusText,
    focusClause,
    issueSignal,
    primarySkill,
  };
};

const buildTechnicalQuestion = ({
  companyStyle,
  topic,
  difficulty,
  contextDetails,
  questionNumber,
  variantSeed,
  previousQuestions = [],
}) => {
  const scenario = contextDetails?.scenario || "a product feature";
  const focusClause = contextDetails?.focusClause || "";
  const issueSignal =
    contextDetails?.issueSignal || "the feature starts behaving inconsistently";
  const topicAtStart = toSentenceStart(topic);
  const topicUsagePhrase = getTopicUsagePhrase(topic);
  const topicSetupPhrase = getTopicSetupPhrase(topic);
  const style = getQuestionStyle({
    companyStyle,
    questionNumber,
    previousQuestions,
    variantSeed: `${variantSeed}|${topic}|${difficulty}`,
  });
  const closingClause = getCompanyClosingClause({
    companyStyle,
    difficulty,
    questionNumber,
    variantSeed: `${variantSeed}|${topic}|${style}`,
  });
  const scopedVariantSeed = `${variantSeed}|technical|${companyStyle}|${difficulty}|${topic}|${style}`;
  const isGoogle = companyStyle === "google";
  const isService = companyStyle === "service";

  if (isGoogle && difficulty === "hard") {
    if (style === "challenge") {
      return pickVariant(
        questionNumber,
        [
          `Two defensible approaches to ${topic} both seem reasonable in ${scenario}${focusClause}. What would make you choose one, and which failure mode would you be protecting against first${closingClause}?`,
          `You have more than one credible path for ${topic} in ${scenario}${focusClause}. What trade-off would decide it for you once the obvious answer disappears${closingClause}?`,
          `${topicAtStart} has more than one valid answer in ${scenario}${focusClause}. What constraint would drive your choice, and what would you refuse to compromise${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "debug") {
      return pickVariant(
        questionNumber,
        [
          `You just shipped ${scenario}, and now ${issueSignal}. Which failure mode would you reason about first in ${topicUsagePhrase}, and why${closingClause}?`,
          `Production is live on ${scenario}, and now ${issueSignal}. Where would you investigate first in ${topicUsagePhrase} if you wanted the highest-signal explanation${closingClause}?`,
          `${topicAtStart} looked fine during development, but ${issueSignal} in ${scenario}. What root cause would you test first, and what made that your first bet${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "direct") {
      return pickVariant(
        questionNumber,
        [
          `Walk me through the point where ${topic} becomes an architecture decision in ${scenario}${focusClause}. What trade-off starts to dominate there${closingClause}?`,
          `Give me your read on when ${topic} stops being straightforward in ${scenario}${focusClause}. What changes in your reasoning at that point${closingClause}?`,
          `Talk me through where ${topic} starts driving the architecture of ${scenario}${focusClause}. Which constraint would shape your answer first${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "follow-up") {
      return pickVariant(
        questionNumber,
        [
          `The first version of ${scenario} is live, and now ${issueSignal}. What would you revisit in ${topicUsagePhrase}, and what future failure are you trying to prevent${closingClause}?`,
          `Staying with ${scenario}${focusClause}, usage is up and ${issueSignal}. What would you change next in ${topicUsagePhrase}, and why does that move come first${closingClause}?`,
          `The feature works, but ${issueSignal} keeps showing up in ${scenario}. What would you tighten in ${topicUsagePhrase} before scale exposes something worse${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    return pickVariant(
      questionNumber,
      [
        `Let's say you're building ${scenario}${focusClause}. When does ${topic} become the decision that changes the shape of the system, and what trade-off shows up first${closingClause}?`,
        `Imagine ${scenario}${focusClause} under real pressure. At what point does ${topic} stop being an implementation detail and become a reasoning problem${closingClause}?`,
        `If ${scenario}${focusClause} keeps growing, when does ${topic} become the part that can quietly break the design if your reasoning is off${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (isGoogle && difficulty === "medium") {
    if (style === "challenge") {
      return pickVariant(
        questionNumber,
        [
          `The first version of ${topicSetupPhrase} works in ${scenario}${focusClause}. What would make you keep it simple, and what would make you step it up${closingClause}?`,
          `You could solve ${topic} in a lighter way or a more structured way for ${scenario}${focusClause}. What would drive that choice for you${closingClause}?`,
          `There is a quick answer and a more deliberate answer for ${topic} in ${scenario}${focusClause}. What would tell you which one is right${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "debug") {
      return pickVariant(
        questionNumber,
        [
          `Users report that ${issueSignal} in ${scenario}. Where would you start with ${topicUsagePhrase}, and what makes that your first hypothesis${closingClause}?`,
          `Now imagine this starts happening in ${scenario}: ${issueSignal}. Which part of ${topicUsagePhrase} would you trace first, and why there${closingClause}?`,
          `The first bug report says ${issueSignal} in ${scenario}. What would you inspect first in ${topic}, and what are you trying to confirm${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "direct") {
      return pickVariant(
        questionNumber,
        [
          `Walk me through where ${topic} starts to matter in ${scenario}${focusClause}. What would drive your first real design choice there${closingClause}?`,
          `Talk me through where ${topic} earns its place in ${scenario}${focusClause}. What would separate a weak answer from a solid one there${closingClause}?`,
          `Give me your take on where ${topic} becomes important in ${scenario}${focusClause}. What would shape your judgment in that moment${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }
  }

  if (isService && difficulty === "hard") {
    if (style === "challenge") {
      return pickVariant(
        questionNumber,
        [
          `You need to implement ${topic} in ${scenario}${focusClause}. Which edge case would you check first so the implementation stays safe and clear${closingClause}?`,
          `Suppose ${scenario}${focusClause} has to support ${topic} by the end of the sprint. What would you lock down first so the implementation does not become fragile${closingClause}?`,
          `If you were responsible for delivering ${topic} in ${scenario}${focusClause}, what would you clarify first before writing the implementation${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "debug") {
      return pickVariant(
        questionNumber,
        [
          `The first bug report says ${issueSignal} in ${scenario}. Where would you check ${topicUsagePhrase} first so another developer could follow your reasoning${closingClause}?`,
          `Users report that ${issueSignal} in ${scenario}. Which part of ${topicUsagePhrase} would you inspect first, and what would you verify there${closingClause}?`,
          `Now imagine this starts happening in ${scenario}: ${issueSignal}. What would you trace first in ${topicUsagePhrase} to keep the fix practical${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "direct") {
      return pickVariant(
        questionNumber,
        [
          `Walk me through how you would implement ${topic} in ${scenario}${focusClause}, including the first edge case you would account for${closingClause}.`,
          `Give me a clear implementation plan for ${topic} in ${scenario}${focusClause}. What would you validate early so the code stays reliable${closingClause}.`,
          `Talk me through how you would build ${topic} in ${scenario}${focusClause}. Which case would you test first before calling it done${closingClause}.`,
        ],
        scopedVariantSeed,
      ).replace(/\.$/, "?");
    }

    return pickVariant(
      questionNumber,
      [
        `Let's say you're building ${scenario}${focusClause}. How would you implement ${topic} cleanly, and which edge case would you check first${closingClause}?`,
        `Imagine ${scenario}${focusClause} needs ${topic} in a way another developer can maintain. What would your first implementation plan look like${closingClause}?`,
        `If you were assigned ${topic} in ${scenario}${focusClause}, how would you build it so the logic stays clear and testable${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (isService && difficulty === "medium") {
    if (style === "challenge") {
      return pickVariant(
        questionNumber,
        [
          `You have a simple way and a slightly more structured way to handle ${topic} in ${scenario}${focusClause}. What would make you choose one over the other${closingClause}?`,
          `If ${scenario}${focusClause} gave you two practical ways to handle ${topic}, what would guide that choice${closingClause}?`,
          `You could keep ${topicSetupPhrase} basic or make it more structured in ${scenario}${focusClause}. What would decide it for you${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "debug") {
      return pickVariant(
        questionNumber,
        [
          `Users report that ${issueSignal} in ${scenario}. Where would you check ${topicUsagePhrase} first${closingClause}?`,
          `The first bug report says ${issueSignal} in ${scenario}. Which part of ${topicUsagePhrase} would you inspect first${closingClause}?`,
          `Now imagine this starts happening in ${scenario}: ${issueSignal}. What would you trace first in ${topicUsagePhrase}${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (style === "direct") {
      return pickVariant(
        questionNumber,
        [
          `Walk me through how you would set up ${topic} in ${scenario}${focusClause}${closingClause}.`,
          `Give me a clear plan for ${topic} in ${scenario}${focusClause}${closingClause}.`,
          `Talk me through how you would approach ${topic} in ${scenario}${focusClause}${closingClause}.`,
        ],
        scopedVariantSeed,
      ).replace(/\.$/, "?");
    }
  }

  if (style === "direct") {
    if (difficulty === "hard") {
      return pickVariant(
        questionNumber,
        [
          `Walk me through the point where ${topic} becomes a real design decision in ${scenario}${focusClause}${closingClause}.`,
          `Give me your read on when ${topic} stops being straightforward in ${scenario}${focusClause}${closingClause}.`,
          `Talk me through where ${topic} starts driving architecture in ${scenario}${focusClause}${closingClause}.`,
        ],
        scopedVariantSeed,
      ).replace(/\.$/, "?");
    }

    if (difficulty === "easy") {
      return pickVariant(
        questionNumber,
        [
          `Walk me through where ${topic} fits in ${scenario}${focusClause}${closingClause}.`,
          `Give me a clear explanation of where ${topic} shows up in ${scenario}${focusClause}${closingClause}.`,
          `When ${scenario} lands on your desk, where does ${topic} matter most${focusClause}${closingClause}.`,
        ],
        scopedVariantSeed,
      ).replace(/\.$/, "?");
    }

    return pickVariant(
      questionNumber,
      [
        `Walk me through where ${topic} starts to matter in ${scenario}${focusClause}${closingClause}.`,
        `Talk me through where ${topic} earns its place in ${scenario}${focusClause}${closingClause}.`,
        `Give me your take on where ${topic} becomes important in ${scenario}${focusClause}${closingClause}.`,
      ],
      scopedVariantSeed,
    ).replace(/\.$/, "?");
  }

  if (style === "debug") {
    if (difficulty === "hard") {
      return pickVariant(
        questionNumber,
        [
          `You just shipped ${scenario}, and now ${issueSignal}. Where do you suspect ${topicUsagePhrase} is breaking down first${closingClause}?`,
          `Production is live on ${scenario}, and now ${issueSignal}. Where would you start pulling apart ${topicUsagePhrase}${closingClause}?`,
          `${topicAtStart} looks fine on paper, but ${issueSignal} in ${scenario}. Where would your investigation begin${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (difficulty === "easy") {
      return pickVariant(
        questionNumber,
        [
          `Users report that ${issueSignal} in ${scenario}. Which part of ${topicUsagePhrase} would you inspect first${closingClause}?`,
          `Users say ${scenario} feels off because ${issueSignal}. Where would you look first in ${topicUsagePhrase}${closingClause}?`,
          `${topicAtStart} is involved, and users keep seeing that ${issueSignal} in ${scenario}. What would you check first${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    return pickVariant(
      questionNumber,
      [
        `Users report that ${issueSignal} in ${scenario}. Where would you start picking apart ${topicUsagePhrase}${closingClause}?`,
        `Now imagine this starts happening in ${scenario}: ${issueSignal}. Which part of ${topicUsagePhrase} would you trace first${closingClause}?`,
        `The first bug report says ${issueSignal} in ${scenario}. Where would ${topic} be your first suspect${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (style === "challenge") {
    if (difficulty === "hard") {
      return pickVariant(
        questionNumber,
        [
          `Two reasonable ways to set up ${topic} both look defensible in ${scenario}${focusClause}. What would make you back one of them${closingClause}?`,
          `You have more than one credible path for ${topic} in ${scenario}${focusClause}. What would decide it for you${closingClause}?`,
          `${topicAtStart} has at least two valid answers in ${scenario}${focusClause}. What would push you toward one choice${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (difficulty === "easy") {
      return pickVariant(
        questionNumber,
        [
          `You have a simple version and a more structured version of ${topicSetupPhrase} for ${scenario}${focusClause}. What would make you choose one over the other${closingClause}?`,
          `If ${scenario}${focusClause} gave you a basic option and a more formal option for ${topicSetupPhrase}, what would guide that choice${closingClause}?`,
          `You could keep ${topicSetupPhrase} simple or give it more structure in ${scenario}${focusClause}. What would decide it for you${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    return pickVariant(
      questionNumber,
      [
        `You just shipped ${scenario}${focusClause}, and ${topicSetupPhrase} is starting to strain. What would make you formalize it now instead of later${closingClause}?`,
        `The first pass of ${topicSetupPhrase} works in ${scenario}${focusClause}, but it is getting stretched. What would make you tighten the design now${closingClause}?`,
        `${topicAtStart} works for the first version of ${scenario}${focusClause}, but the cracks are starting to show. What would make you step up the design${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (style === "follow-up") {
    if (difficulty === "hard") {
      return pickVariant(
        questionNumber,
        [
          `The first version of ${scenario} is live, and now ${issueSignal}. What would you revisit in ${topicUsagePhrase}${focusClause}${closingClause}?`,
          `Staying with ${scenario}${focusClause}, usage is up and ${issueSignal}. What changes around ${topicUsagePhrase} would you make next${closingClause}?`,
          `The feature already works, but ${issueSignal} keeps showing up in ${scenario}. What would you tighten up in ${topicUsagePhrase}${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    if (difficulty === "easy") {
      return pickVariant(
        questionNumber,
        [
          `The first cut of ${scenario} works. If the next request touches ${topicUsagePhrase}, what would you clean up first${closingClause}?`,
          `Assume the first version of ${scenario} is already out. When ${topicUsagePhrase} comes back up, what would you revisit first${closingClause}?`,
          `${topicAtStart} did enough to get ${scenario} shipped. What would you tighten first on the next pass${closingClause}?`,
        ],
        scopedVariantSeed,
      );
    }

    return pickVariant(
      questionNumber,
      [
        `The first version of ${scenario} is live${focusClause}. If usage grows next week, what would you revisit about ${topicUsagePhrase}${closingClause}?`,
        `Staying with ${scenario}${focusClause}, the first release works but is starting to stretch. What would you refine next in ${topicUsagePhrase}${closingClause}?`,
        `Now that ${scenario} is out${focusClause}, what would you adjust first in ${topicUsagePhrase} before the next round of growth${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (difficulty === "hard") {
    return pickVariant(
      questionNumber,
      [
        `Let's say you're building ${scenario}${focusClause}. When does ${topic} become the part that can make or break the system${closingClause}?`,
        `Let's say ${scenario}${focusClause} is moving toward real scale. At what point does ${topic} become the decision you cannot afford to bluff${closingClause}?`,
        `Imagine ${scenario}${focusClause} under real pressure. When does ${topic} stop being a detail and become the main design call${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (difficulty === "easy") {
    return pickVariant(
      questionNumber,
      [
        `Let's say you're building ${scenario}${focusClause}. Where does ${topic} come into the picture${closingClause}?`,
        `Imagine you're putting together ${scenario}${focusClause}. At what point would ${topic} show up${closingClause}?`,
        `You're building ${scenario}${focusClause}. Where does ${topic} naturally fit${closingClause}?`,
      ],
      scopedVariantSeed,
    );
  }

  return pickVariant(
    questionNumber,
    [
      `Let's say you're building ${scenario}${focusClause}. When does ${topic} start to matter in a serious way${closingClause}?`,
      `Imagine ${scenario}${focusClause} is already moving beyond the first pass. Where does ${topic} start carrying real weight${closingClause}?`,
      `You're building ${scenario}${focusClause}, and things are getting more demanding. Where does ${topic} start shaping the outcome${closingClause}?`,
    ],
    scopedVariantSeed,
  );
};

const buildHrQuestion = ({
  companyStyle,
  topic,
  difficulty,
  contextDetails,
  questionNumber,
  variantSeed,
}) => {
  const focusClause = contextDetails?.focusClause || "";
  const scopedVariantSeed = `${variantSeed}|hr|${companyStyle}|${difficulty}|${topic}`;

  if (companyStyle === "google") {
    return pickVariant(
      questionNumber,
      [
        `Tell me about a time you had to explain a difficult decision involving ${topic}${focusClause} and make your reasoning clear to someone else.`,
        `Tell me about a time you worked on ${topic}${focusClause} and had to defend your thinking to others.`,
        `Describe a situation where ${topic}${focusClause} was involved and you had to explain your approach clearly.`,
      ],
      scopedVariantSeed,
    );
  }

  if (companyStyle === "amazon") {
    return pickVariant(
      questionNumber,
      [
        `Tell me about a time you had to make a practical decision involving ${topic}${focusClause} under pressure.`,
        `Describe a situation where ${topic}${focusClause} forced you to make a quick call with limited time.`,
        `Tell me about a time you had to balance speed and judgment while working on ${topic}${focusClause}.`,
      ],
      scopedVariantSeed,
    );
  }

  if (companyStyle === "startup") {
    return pickVariant(
      questionNumber,
      [
        `Tell me about a time you had to move quickly on work involving ${topic}${focusClause} with very little guidance.`,
        `Describe a situation where you had to figure out ${topic}${focusClause} on your own and still deliver.`,
        `Tell me about a time you had to take ownership of ${topic}${focusClause} without much structure around you.`,
      ],
      scopedVariantSeed,
    );
  }

  if (companyStyle === "service") {
    return pickVariant(
      questionNumber,
      [
        `Tell me about a time you applied ${topic}${focusClause} and had to explain your work clearly.`,
        `Describe a time when you used ${topic}${focusClause} and had to communicate it to someone else.`,
        `Tell me about a situation where ${topic}${focusClause} came up and clarity mattered.`,
      ],
      scopedVariantSeed,
    );
  }

  if (difficulty === "hard") {
    return pickVariant(
      questionNumber,
      [
        `Tell me about a time you had to influence others during a difficult discussion involving ${topic}${focusClause}.`,
        `Describe a situation where ${topic}${focusClause} led to disagreement and you had to move the conversation forward.`,
        `Tell me about a time you had to lead a tough discussion around ${topic}${focusClause}.`,
      ],
      scopedVariantSeed,
    );
  }

  return pickVariant(
    questionNumber,
    [
      `Tell me about a time you worked with ${topic}${focusClause}.`,
      `Describe a situation where ${topic}${focusClause} was part of your work.`,
      `Tell me about a project where ${topic}${focusClause} mattered.`,
    ],
    scopedVariantSeed,
  );
};

const buildManagerialQuestion = ({
  companyStyle,
  topic,
  difficulty,
  contextDetails,
  questionNumber,
  variantSeed,
}) => {
  const scenario = contextDetails?.scenario || "a product feature";
  const focusClause = contextDetails?.focusClause || "";
  const scopedVariantSeed = `${variantSeed}|managerial|${companyStyle}|${difficulty}|${topic}`;

  if (companyStyle === "google") {
    return pickVariant(
      questionNumber,
      [
        `How would you lead a team discussion if there were multiple valid ways to approach ${topic}${focusClause} for ${scenario}?`,
        `If your team disagreed on ${topic}${focusClause} in ${scenario}, how would you drive the discussion?`,
        `How would you help a team choose an approach for ${topic}${focusClause} in ${scenario} when several options looked reasonable?`,
      ],
      scopedVariantSeed,
    );
  }

  if (companyStyle === "amazon") {
    return pickVariant(
      questionNumber,
      [
        `How would you decide between speed and long-term maintainability for ${topic}${focusClause} in ${scenario}?`,
        `If ${topic}${focusClause} in ${scenario} created a speed-versus-quality trade-off, how would you make the call?`,
        `How would you justify a decision on ${topic}${focusClause} in ${scenario} when delivery pressure is high?`,
      ],
      scopedVariantSeed,
    );
  }

  if (companyStyle === "startup") {
    return pickVariant(
      questionNumber,
      [
        `If engineering time was limited, how would you prioritize ${topic}${focusClause} in ${scenario}?`,
        `If ${scenario} had to ship fast, how would you decide what matters most about ${topic}${focusClause}?`,
        `How would you prioritize ${topic}${focusClause} in ${scenario} when the team cannot build everything at once?`,
      ],
      scopedVariantSeed,
    );
  }

  if (companyStyle === "service") {
    return pickVariant(
      questionNumber,
      [
        `How would you guide a team if there was disagreement about ${topic}${focusClause} in ${scenario}?`,
        `If a team was split on ${topic}${focusClause} in ${scenario}, how would you move them to a decision?`,
        `How would you handle conflicting views on ${topic}${focusClause} in ${scenario}?`,
      ],
      scopedVariantSeed,
    );
  }

  if (difficulty === "hard") {
    return pickVariant(
      questionNumber,
      [
        `How would you balance technical quality, delivery speed, and team alignment when making decisions about ${topic}${focusClause} in ${scenario}?`,
        `If ${topic}${focusClause} in ${scenario} created pressure from multiple sides, how would you make the decision?`,
        `How would you lead a decision on ${topic}${focusClause} in ${scenario} when quality and delivery goals conflict?`,
      ],
      scopedVariantSeed,
    );
  }

  return pickVariant(
    questionNumber,
    [
      `How would you drive a decision if your team disagreed on ${topic}${focusClause} in ${scenario}?`,
      `If your team was split on ${topic}${focusClause} in ${scenario}, how would you get to a decision?`,
      `How would you move a team forward when there are different opinions about ${topic}${focusClause} in ${scenario}?`,
    ],
    scopedVariantSeed,
  );
};

const buildFallbackQuestion = ({
  company,
  round,
  skills,
  difficulty,
  focus,
  domain,
  questionNumber,
  previousQuestions = [],
  previousTopics,
  preferredTopic,
  variantSeed,
}) => {
  const normalizedCompany = normalizeCompany(company);
  const normalizedRound = normalizeRound(round);
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const normalizedSkills = normalizeSkills(skills);
  const focusAreas = normalizeFocusAreas(focus);
  const normalizedDomain = normalizeDomain(domain);
  const topic = pickTopic({
    focusAreas,
    skills: normalizedSkills,
    round: normalizedRound,
    domain: normalizedDomain,
    preferredTopic,
    previousTopics,
    questionNumber,
  });
  const companyStyle = getCompanyStyle(normalizedCompany);
  const contextDetails = getContextDetails({
    topic,
    focusAreas,
    skills: normalizedSkills,
    domain: normalizedDomain,
    questionNumber,
    variantSeed,
    companyStyle,
  });

  let question = buildTechnicalQuestion({
    companyStyle,
    topic,
    difficulty: normalizedDifficulty,
    contextDetails,
    questionNumber,
    variantSeed,
    previousQuestions,
  });

  if (normalizedRound === "hr") {
    question = buildHrQuestion({
      companyStyle,
      topic,
      difficulty: normalizedDifficulty,
      contextDetails,
      questionNumber,
      variantSeed,
    });
  } else if (normalizedRound === "managerial") {
    question = buildManagerialQuestion({
      companyStyle,
      topic,
      difficulty: normalizedDifficulty,
      contextDetails,
      questionNumber,
      variantSeed,
    });
  }

  return {
    question,
    difficulty: normalizedDifficulty,
    topic,
  };
};

const generateWithGemini = async ({
  company,
  round,
  skills,
  difficulty,
  focus,
  domain,
  questionNumber,
  previousQuestions = [],
  preferredTopic,
  variantSeed,
}) => {
  const manager = getApiKeyManager();

  if (!manager.apiKeys || manager.apiKeys.length === 0) {
    return null;
  }

  try {
    const response = await manager.executeWithFallback(async (ai) => {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `
You are an experienced technical interviewer.

Your job is to generate ONE interview question that feels natural, realistic, and human-like.

---

INPUT:

* Company: ${company}
* Role: ${domain || "general"}
* Difficulty: ${difficulty}
* Skills: ${normalizeSkills(skills).join(", ") || "Not specified"}
* Focus Areas: ${normalizeFocusAreas(focus).join(", ") || "Not specified"}
* Question Number: ${questionNumber || 1}

---

OPTIONAL CONTEXT:

* Round: ${round || "technical"}
* Preferred Topic: ${preferredTopic || "Not specified"}
* Previous Questions:
${previousQuestions.length > 0 ? previousQuestions.map((question, index) => `  ${index + 1}. ${question}`).join("\n") : "  None"}
* Variation Seed: ${variantSeed || "default"}

---

GOAL:

Generate a question that:

* Sounds like a real interviewer speaking
* Is NOT templated or repetitive
* Uses varied phrasing and tone
* Feels contextual, not generic

---

STYLE VARIATION (IMPORTANT):

Randomly choose ONE style:

1. Direct -> clear concept explanation
2. Scenario -> real-world situation
3. Debug -> something is broken
4. Challenge -> trade-offs / failure thinking
5. Follow-up -> builds on previous idea

---

RULES:

* Do NOT repeat patterns like:
  "How would you handle..."
  "What trade-offs would you consider..."
  "How would you design..."
* Avoid predictable sentence structures
* Use natural language like:
  "Let's say you're building..."
  "Now imagine this breaks..."
  "Users report an issue..."
  "You just shipped this..."
* Use skills and focus areas meaningfully
* Tie the question to a real ${domain || "technical"} scenario
* Avoid abstract textbook questions
* If previous questions exist, do NOT repeat or closely paraphrase them
* Ask ONLY ONE question
* Keep it conversational and specific
* Do NOT explain the answer

---

DIFFICULTY CONTROL:

* Easy -> basic understanding, simple explanation
* Medium -> application + reasoning
* Hard -> trade-offs, edge cases, failure modes

---

OUTPUT FORMAT:

{
"question": "",
"difficulty": "",
"topic": ""
}

---

Return ONLY JSON. No explanation.
`,
      });
    });

    const rawText = typeof response.text === "string" ? response.text : "";
    if (!rawText) {
      return null;
    }

    return normalizeQuestion(parseJsonPayload(rawText));
  } catch (error) {
    console.error("Question generation error:", error?.message);
    return null;
  }
};

const generateInterviewQuestion = async ({
  company,
  round,
  skills,
  difficulty,
  level,
  focus,
  domain,
  questionNumber = 1,
  previousQuestions = [],
  previousTopics = [],
  preferredTopic = "",
  variantSeed = "",
}) => {
  const resolvedDifficulty = normalizeDifficulty(difficulty || level);

  try {
    const aiQuestion = await generateWithGemini({
      company,
      round,
      skills,
      difficulty: resolvedDifficulty,
      focus,
      domain,
      questionNumber,
      previousQuestions,
      preferredTopic,
      variantSeed,
    });
    if (aiQuestion?.question) {
      return {
        generator: "gemini",
        question: aiQuestion,
      };
    }
  } catch (error) {
    // Fall back to deterministic question generation when the AI call fails.
  }

  return {
    generator: "fallback",
    question: buildFallbackQuestion({
      company,
      round,
      skills,
      difficulty: resolvedDifficulty,
      focus,
      domain,
      questionNumber,
      previousQuestions,
      previousTopics,
      preferredTopic,
      variantSeed,
    }),
  };
};

module.exports = {
  analyzeSkills,
  generateInterviewQuestion,
  normalizeSkills,
  normalizeFocusAreas,
};
