const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL = "gemini-2.5-flash";
const SKILL_KEYS = ["languages", "frameworks", "tools", "concepts"];
const SECTION_LABEL_SOURCE =
  "(?:technical skills?|skills?|languages?|frontend|backend|frameworks?|libraries|tools?|concepts?|project technologies|technologies|tech stack)";
const SECTION_LABEL_PATTERN = new RegExp(`\\b${SECTION_LABEL_SOURCE}\\s*:`, "gi");
const MERGED_LABEL_PATTERN = new RegExp(`([^\\n])\\s+(${SECTION_LABEL_SOURCE}\\s*:)`, "gi");
const FRAGMENT_SPLIT_PATTERN =
  /\n|,|;|\||\t|\b(?:and|with|using|includes?|including)\b/gi;
const SKILL_FRAGMENT_STOPWORDS = new Set([
  "a",
  "an",
  "at",
  "built",
  "college",
  "course",
  "created",
  "developed",
  "for",
  "from",
  "i",
  "in",
  "my",
  "of",
  "on",
  "the",
  "to",
  "used",
  "using",
  "with",
  "work",
  "worked",
]);

const SKILL_CATALOG = {
  languages: [
    { name: "JavaScript", patterns: [/\bjavascript\b/gi] },
    { name: "TypeScript", patterns: [/\btype\s*script\b/gi, /\btypescript\b/gi] },
    { name: "Python", patterns: [/\bpython\b/gi] },
    { name: "Java", patterns: [/\bjava\b/gi] },
    { name: "Rust", patterns: [/\brust\b/gi] },
    { name: "PHP", patterns: [/\bphp\b/gi] },
    { name: "Ruby", patterns: [/\bruby\b/gi] },
    { name: "Kotlin", patterns: [/\bkotlin\b/gi] },
    { name: "Swift", patterns: [/\bswift\b/gi] },
    { name: "Dart", patterns: [/\bdart\b/gi] },
    { name: "SQL", patterns: [/\bsql\b/gi] },
    { name: "Bash", patterns: [/\bbash\b/gi, /\bshell scripting\b/gi] },
  ],
  frameworks: [
    { name: "HTML", patterns: [/\bhtml(?:5)?\b/gi] },
    { name: "CSS", patterns: [/\bcss(?:3)?\b/gi] },
    { name: "React.js", patterns: [/\breact(?:\.js|js)?\b/gi] },
    { name: "React Router", patterns: [/\breact router(?: dom)?\b/gi, /\breact-router(?:-dom)?\b/gi] },
    { name: "Next.js", patterns: [/\bnext(?:\.js|js)?\b/gi] },
    { name: "Node.js", patterns: [/\bnode(?:\.js|js)?\b/gi] },
    { name: "Express.js", patterns: [/\bexpress(?:\.js|js)?\b/gi] },
    { name: "Angular", patterns: [/\bangular\b/gi] },
    { name: "Vue.js", patterns: [/\bvue(?:\.js|js)?\b/gi] },
    { name: "Nuxt.js", patterns: [/\bnuxt(?:\.js|js)?\b/gi] },
    { name: "NestJS", patterns: [/\bnest(?:\.js|js)?\b/gi, /\bnestjs\b/gi] },
    { name: "Redux Toolkit", patterns: [/\bredux toolkit\b/gi] },
    { name: "Redux", patterns: [/\bredux\b/gi] },
    { name: "Tailwind CSS", patterns: [/\btailwind(?:\s+css)?\b/gi] },
    { name: "Bootstrap", patterns: [/\bbootstrap\b/gi] },
    { name: "Material UI", patterns: [/\bmaterial ui\b/gi, /\bmui\b/gi] },
    { name: "Spring Boot", patterns: [/\bspring boot\b/gi] },
    { name: "Django", patterns: [/\bdjango\b/gi] },
    { name: "Flask", patterns: [/\bflask\b/gi] },
    { name: "FastAPI", patterns: [/\bfastapi\b/gi, /\bfast api\b/gi] },
    { name: "React Native", patterns: [/\breact native\b/gi] },
    { name: "Flutter", patterns: [/\bflutter\b/gi] },
    { name: "ASP.NET", patterns: [/\basp\.net\b/gi, /\basp net\b/gi] },
    { name: "Laravel", patterns: [/\blaravel\b/gi] },
  ],
  tools: [
    { name: "Git", patterns: [/\bgit\b/gi] },
    { name: "GitHub", patterns: [/\bgithub\b/gi] },
    { name: "GitLab", patterns: [/\bgitlab\b/gi] },
    { name: "Postman", patterns: [/\bpostman\b/gi] },
    { name: "Docker", patterns: [/\bdocker\b/gi] },
    { name: "Kubernetes", patterns: [/\bkubernetes\b/gi, /\bk8s\b/gi] },
    { name: "Jenkins", patterns: [/\bjenkins\b/gi] },
    { name: "AWS", patterns: [/\baws\b/gi, /\bamazon web services\b/gi] },
    { name: "Azure", patterns: [/\bazure\b/gi] },
    { name: "GCP", patterns: [/\bgcp\b/gi, /\bgoogle cloud\b/gi] },
    { name: "MongoDB", patterns: [/\bmongo\s*db\b/gi, /\bmongodb\b/gi] },
    { name: "MySQL", patterns: [/\bmysql\b/gi] },
    { name: "PostgreSQL", patterns: [/\bpostgresql\b/gi, /\bpostgres\b/gi] },
    { name: "Redis", patterns: [/\bredis\b/gi] },
    { name: "Firebase", patterns: [/\bfirebase\b/gi] },
    { name: "Supabase", patterns: [/\bsupabase\b/gi] },
    { name: "Linux", patterns: [/\blinux\b/gi] },
    { name: "Figma", patterns: [/\bfigma\b/gi] },
    { name: "Vercel", patterns: [/\bvercel\b/gi] },
    { name: "Netlify", patterns: [/\bnetlify\b/gi] },
    { name: "NPM", patterns: [/\bnpm\b/gi] },
    { name: "Yarn", patterns: [/\byarn\b/gi] },
    { name: "Parcel", patterns: [/\bparcel\b/gi] },
    { name: "Webpack", patterns: [/\bwebpack\b/gi] },
    { name: "Babel", patterns: [/\bbabel\b/gi] },
    { name: "Jira", patterns: [/\bjira\b/gi] },
    { name: "VS Code", patterns: [/\bvs\.?\s*code\b/gi, /\bvisual studio code\b/gi] },
  ],
  concepts: [
    { name: "Data Structures", patterns: [/\bdata structures?\b/gi] },
    { name: "Algorithms", patterns: [/\balgorithms?\b/gi] },
    { name: "OOP", patterns: [/\boop\b/gi, /\bobject[- ]oriented programming\b/gi] },
    { name: "DBMS", patterns: [/\bdbms\b/gi, /\bdatabase management systems?\b/gi] },
    { name: "Operating Systems", patterns: [/\boperating systems?\b/gi] },
    { name: "Computer Networks", patterns: [/\bcomputer networks?\b/gi] },
    { name: "REST APIs", patterns: [/\brest(?:ful)?\s+apis?\b/gi] },
    { name: "API Integration", patterns: [/\bapi integrations?\b/gi] },
    { name: "Responsive Design", patterns: [/\bresponsive design\b/gi] },
    { name: "State Management", patterns: [/\bstate management\b/gi] },
    { name: "Problem Solving", patterns: [/\bproblem[\s-]*solving\b/gi] },
    { name: "Machine Learning", patterns: [/\bmachine learning\b/gi] },
    { name: "System Design", patterns: [/\bsystem design\b/gi] },
    { name: "Microservices", patterns: [/\bmicroservices?\b/gi] },
    { name: "CI/CD", patterns: [/\bci\/cd\b/gi, /\bcontinuous integration\b/gi] },
    { name: "Authentication", patterns: [/\bauthentication\b/gi] },
    { name: "Authorization", patterns: [/\bauthorization\b/gi] },
    { name: "MVC", patterns: [/\bmvc\b/gi] },
  ],
};

const EXACT_TOKEN_SKILLS = new Map([
  ["c", { category: "languages", name: "C" }],
  ["c++", { category: "languages", name: "C++" }],
  ["c#", { category: "languages", name: "C#" }],
  ["css", { category: "frameworks", name: "CSS" }],
  ["css3", { category: "frameworks", name: "CSS" }],
  ["html", { category: "frameworks", name: "HTML" }],
  ["html5", { category: "frameworks", name: "HTML" }],
  ["go", { category: "languages", name: "Go" }],
  ["golang", { category: "languages", name: "Go" }],
]);

const createEmptySkillResult = () => ({
  languages: [],
  frameworks: [],
  tools: [],
  concepts: [],
});

const createEmptySkillSets = () => ({
  languages: new Set(),
  frameworks: new Set(),
  tools: new Set(),
  concepts: new Set(),
});

const normalizeForComparison = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9+#]/g, "");

const cleanText = (text = "") =>
  text
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[•●▪■◦]/g, " ")
    .replace(/(\w)-\s+(\w)/g, "$1$2")
    .replace(MERGED_LABEL_PATTERN, "$1\n$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

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

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
    return strippedValue;
  }

  return strippedValue.slice(firstBraceIndex, lastBraceIndex + 1);
};

const parseJsonPayload = (value = "") => JSON.parse(extractJsonPayload(value));

const hasSkillMatches = (skillSets) =>
  SKILL_KEYS.some((category) => skillSets[category].size > 0);

const mergeSkillSets = (target, source) => {
  for (const category of SKILL_KEYS) {
    for (const item of source[category]) {
      target[category].add(item);
    }
  }
};

const skillSetsToObject = (skillSets) =>
  SKILL_KEYS.reduce((result, category) => {
    result[category] = [...skillSets[category]].sort((a, b) => a.localeCompare(b));
    return result;
  }, createEmptySkillResult());

const cleanSkillToken = (value = "") =>
  value
    .replace(SECTION_LABEL_PATTERN, " ")
    .replace(/[•●▪■◦]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitIntoFragments = (text = "") =>
  cleanText(text)
    .split(FRAGMENT_SPLIT_PATTERN)
    .map((fragment) => cleanSkillToken(fragment))
    .filter(Boolean);

const buildPatternCandidates = (text) => {
  const candidates = [];

  for (const category of SKILL_KEYS) {
    for (const entry of SKILL_CATALOG[category]) {
      for (const pattern of entry.patterns) {
        const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
        const regex = new RegExp(pattern.source, flags);
        let match = regex.exec(text);

        while (match) {
          candidates.push({
            category,
            name: entry.name,
            start: match.index,
            end: match.index + match[0].length,
          });

          if (match[0].length === 0) {
            regex.lastIndex += 1;
          }

          match = regex.exec(text);
        }
      }
    }
  }

  return candidates.sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    return right.end - left.end;
  });
};

const rangesOverlap = (left, right) => left.start < right.end && right.start < left.end;

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isLikelySkillListFragment = (fragment = "") => {
  const words = fragment
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0 || words.length > 6) {
    return false;
  }

  return !words.some((word) => SKILL_FRAGMENT_STOPWORDS.has(word.toLowerCase()));
};

const buildExactTokenCandidates = (text) => {
  const candidates = [];

  for (const [token, skill] of EXACT_TOKEN_SKILLS.entries()) {
    const regex = new RegExp(`(^|[^A-Za-z0-9+#])(${escapeRegex(token)})(?=$|[^A-Za-z0-9+#])`, "gi");
    let match = regex.exec(text);

    while (match) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;

      candidates.push({
        category: skill.category,
        name: skill.name,
        start,
        end,
      });

      if (match[0].length === 0) {
        regex.lastIndex += 1;
      }

      match = regex.exec(text);
    }
  }

  return candidates.sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    return right.end - left.end;
  });
};

const extractFragmentMatches = (fragment) => {
  const skillSets = createEmptySkillSets();
  const normalizedFragment = cleanSkillToken(fragment);

  if (!normalizedFragment) {
    return skillSets;
  }

  const exactMatch = EXACT_TOKEN_SKILLS.get(normalizeForComparison(normalizedFragment));
  if (exactMatch) {
    skillSets[exactMatch.category].add(exactMatch.name);
  }

  const acceptedRanges = [];
  for (const candidate of buildPatternCandidates(normalizedFragment)) {
    if (acceptedRanges.some((range) => rangesOverlap(range, candidate))) {
      continue;
    }

    acceptedRanges.push(candidate);
    skillSets[candidate.category].add(candidate.name);
  }

  if (isLikelySkillListFragment(normalizedFragment)) {
    for (const candidate of buildExactTokenCandidates(normalizedFragment)) {
      if (acceptedRanges.some((range) => rangesOverlap(range, candidate))) {
        continue;
      }

      acceptedRanges.push(candidate);
      skillSets[candidate.category].add(candidate.name);
    }
  }

  return skillSets;
};

const extractCatalogMatches = (text = "") => {
  const skillSets = createEmptySkillSets();

  for (const fragment of splitIntoFragments(text)) {
    mergeSkillSets(skillSets, extractFragmentMatches(fragment));
  }

  return skillSets;
};

const isLikelySkillToken = (token = "") => {
  if (!token || token.length > 40 || /[.!?]/.test(token)) {
    return false;
  }

  const words = token.split(/\s+/);
  if (words.length > 5) {
    return false;
  }

  return !/^(languages?|frontend|backend|frameworks?|libraries|tools?|concepts?|technical skills?|skills?|project technologies|technologies|tech stack)$/i.test(
    token,
  );
};

const normalizeStructuredSkills = (data) => {
  const normalizedData = data && typeof data === "object" ? data : {};
  const resultSets = createEmptySkillSets();

  for (const category of SKILL_KEYS) {
    const values = Array.isArray(normalizedData[category]) ? normalizedData[category] : [];

    for (const value of values) {
      if (typeof value !== "string") {
        continue;
      }

      const fragments = splitIntoFragments(value);

      for (const fragment of fragments) {
        const fragmentMatches = extractFragmentMatches(fragment);

        if (hasSkillMatches(fragmentMatches)) {
          mergeSkillSets(resultSets, fragmentMatches);
          continue;
        }

        if (isLikelySkillToken(fragment)) {
          resultSets[category].add(fragment);
        }
      }
    }
  }

  return skillSetsToObject(resultSets);
};

const buildFallbackSkills = (text) => skillSetsToObject(extractCatalogMatches(text));

const parseWithGemini = async (text) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `
You are an expert resume parser.

The input text may be messy due to PDF extraction errors.
Sections may be merged or broken.

Your job is to carefully analyze the text and extract structured technical information.

---

INSTRUCTIONS:

1. Identify sections manually from text patterns such as:

   * Languages
   * Frontend
   * Tools
   * Concepts
   * Project technologies

2. Extract only clearly mentioned technical skills.

3. Clean broken text:
   Example:
   "Java Frontend: React.js" -> "Java", "React.js"

4. Remove noise like:

   * bullets (•)
   * broken words (Prob- lem -> Problem)
   * section labels mixed with skills

---

OUTPUT FORMAT (STRICT JSON):

{
"languages": [],
"frameworks": [],
"tools": [],
"concepts": []
}

---

IMPORTANT:

* DO NOT guess
* DO NOT include duplicates
* DO NOT include irrelevant text
* Return ONLY JSON

---

TEXT:
${text}
`,
  });

  const rawText = typeof response.text === "string" ? response.text : "";
  if (!rawText) {
    return null;
  }

  return normalizeStructuredSkills(parseJsonPayload(rawText));
};

const parseResumeBuffer = async (fileBuffer) => {
  const parser = new PDFParse({ data: fileBuffer });
  let extractedText = "";

  try {
    const parsedPdf = await parser.getText();
    extractedText = cleanText(parsedPdf.text);
  } finally {
    try {
      await parser.destroy();
    } catch (error) {
      // Parser cleanup should not fail the whole upload after text extraction succeeds.
    }
  }

  if (!extractedText) {
    throw new Error("Unable to extract text from the uploaded PDF");
  }

  try {
    const aiParsedData = await parseWithGemini(extractedText);
    if (aiParsedData) {
      return {
        parser: "gemini",
        extractedText,
        parsedData: aiParsedData,
      };
    }
  } catch (error) {
    // Fall back to deterministic matching when the AI call fails.
  }

  return {
    parser: "fallback",
    // extractedText,
    parsedData: buildFallbackSkills(extractedText),
  };
};

module.exports = { parseResumeBuffer };
