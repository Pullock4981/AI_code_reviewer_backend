const levelGuide = {
  BEGINNER:     "Use very simple language. Avoid jargon. Be encouraging. Explain concepts from scratch. Do not assume framework knowledge.",
  INTERMEDIATE: "Use standard professional language. Reference common patterns. Be direct and specific.",
  ADVANCED:     "Use peer-level technical language. Reference SOLID, design patterns, Big-O, architectural concerns. Be comprehensive.",
};

const depthGuide = {
  QUICK:    "Focus only on critical issues and top 3 improvements. Keep output concise.",
  STANDARD: "Cover all major issues, key positives, security basics, and main improvements.",
  DETAILED: "Deep dive into every aspect: logic, style, architecture, security, performance, code smells.",
};

const strictnessGuide = {
  LENIENT:  "Be lenient. Only flag major bugs. Skip minor style issues.",
  STANDARD: "Balance between strict and lenient. Flag all real bugs and important style issues.",
  STRICT:   "Be thorough. Flag every issue including minor style, naming, and potential improvements.",
};

const frameworkGuide = {
  "react": "FRAMEWORK RULES (React): Check for Rules of Hooks, infinite re-renders (e.g. missing dependency arrays), proper use of state/context, missing 'key' props in iterators, and component modularity.",
  "typescript": "FRAMEWORK RULES (TypeScript): Check for strict type definitions. Penalize the use of 'any'. Enforce interfaces/types instead of implicit typing. Check for null/undefined handling.",
  "typescript-react": "FRAMEWORK RULES (React + TypeScript): Check for Rules of Hooks, missing 'key' props, and proper state management. Enforce strict typing for component props and state. Penalize 'any'."
};

const getFrameworkRules = (lang) => {
  if (!lang) return "";
  const l = lang.toLowerCase();
  return frameworkGuide[l] || "";
};

const build = ({ code, language, studentLevel, reviewDepth, strictnessLevel, focusAreas, assignmentContext, customInstructions }) => {
  const frameworkRules = getFrameworkRules(language);
  
  const systemPrompt = `You are an expert code reviewer helping a technical instructor review student code.
Your reviews are structured, specific, and pedagogically appropriate.

STUDENT LEVEL: ${studentLevel}
Guidance: ${levelGuide[studentLevel]}

REVIEW DEPTH: ${reviewDepth}
Guidance: ${depthGuide[reviewDepth]}

STRICTNESS: ${strictnessLevel}
Guidance: ${strictnessGuide[strictnessLevel]}

${frameworkRules ? `${frameworkRules}` : ""}

${focusAreas && focusAreas.length > 0 ? `FOCUS AREAS: Pay special attention to: ${focusAreas.join(", ")}` : ""}

${assignmentContext ? `ASSIGNMENT CONTEXT: The student was asked to: ${assignmentContext}` : ""}

${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}

CRITICAL OUTPUT RULES:
1. Respond ONLY with a valid JSON object — no text before or after
2. Never include markdown code fences like \`\`\`json
3. All array fields must be arrays even if empty []
4. severity must be one of: CRITICAL, HIGH, MEDIUM, LOW, INFO
5. overallVerdict.label must be one of: EXCELLENT, GOOD, NEEDS_WORK, REDO
6. overallRisk must be one of: NONE, LOW, MEDIUM, HIGH, CRITICAL
7. overallRating must be one of: EXCELLENT, GOOD, FAIR, POOR
8. Always find at least 1 positive finding — no code is 100% bad`;

  const userPrompt = `Review the following ${language} code and return a JSON object with EXACTLY this structure:

{
  "summary": "A precise instructor-style short summary of the code.",
  "examinerFeedback": "Markdown string formatted as an Examiner's Feedback checklist. CRITICAL: You MUST read the CUSTOM INSTRUCTIONS. If the user provided a list of requirements or points, you MUST evaluate the code STRICTLY against those exact points. Keep the exact section headers and numbering provided by the user. For each point, append ' - okay।' if the code satisfies it, or ' - needs improvement।' if it fails.",
  "overallVerdict": {
    "label": "EXCELLENT|GOOD|NEEDS_WORK|REDO",
    "score": 75,
    "justification": "Why this score."
  }
}

CODE TO REVIEW (${language}):
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON. Nothing else.`;

  return { systemPrompt, userPrompt };
};

const buildBatch = ({ files, studentLevel, reviewDepth, strictnessLevel, focusAreas, assignmentContext, customInstructions }) => {
  // If ANY file is react/typescript, apply the rule globally for the batch
  let batchFrameworkRules = "";
  if (files.some(f => f.language === 'typescript-react' || f.language === 'react')) {
    batchFrameworkRules += frameworkGuide["react"] + " ";
  }
  if (files.some(f => f.language === 'typescript-react' || f.language === 'typescript')) {
    batchFrameworkRules += frameworkGuide["typescript"] + " ";
  }

  const systemPrompt = `You are an expert code reviewer helping a technical instructor review student code.
Your reviews are structured, specific, and pedagogically appropriate.

STUDENT LEVEL: ${studentLevel}
Guidance: ${levelGuide[studentLevel]}

REVIEW DEPTH: ${reviewDepth}
Guidance: ${depthGuide[reviewDepth]}

STRICTNESS: ${strictnessLevel}
Guidance: ${strictnessGuide[strictnessLevel]}

${batchFrameworkRules.trim() ? `${batchFrameworkRules.trim()}` : ""}

${focusAreas && focusAreas.length > 0 ? `FOCUS AREAS: Pay special attention to: ${focusAreas.join(", ")}` : ""}

${assignmentContext ? `ASSIGNMENT CONTEXT: The student was asked to: ${assignmentContext}` : ""}

${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}

CRITICAL OUTPUT RULES:
1. Respond ONLY with a valid JSON object — no text before or after
2. Never include markdown code fences like \`\`\`json
3. All array fields must be arrays even if empty []
4. severity must be one of: CRITICAL, HIGH, MEDIUM, LOW, INFO
5. overallVerdict.label must be one of: EXCELLENT, GOOD, NEEDS_WORK, REDO
6. overallRisk must be one of: NONE, LOW, MEDIUM, HIGH, CRITICAL
7. Always find at least 1 positive finding per file — no code is 100% bad`;

  let filesText = files.map((f, i) => `--- FILE ${i + 1}: ${f.path} (${f.language}) ---\n\`\`\`${f.language}\n${f.code}\n\`\`\``).join("\n\n");

  const userPrompt = `Review the following files and return a JSON object with EXACTLY this structure:

{
  "reviews": [
    {
      "file": "path/to/file",
      "review": {
        "summary": "A precise instructor-style short summary of the code.",
        "examinerFeedback": "Markdown string formatted as an Examiner's Feedback checklist. CRITICAL: You MUST read the CUSTOM INSTRUCTIONS. If the user provided a list of requirements or points, you MUST evaluate the code STRICTLY against those exact points. Keep the exact section headers and numbering provided by the user. For each point, append ' - okay।' if the code satisfies it, or ' - needs improvement।' if it fails.",
        "overallVerdict": {
          "label": "EXCELLENT|GOOD|NEEDS_WORK|REDO",
          "score": 75,
          "justification": "Why this score."
        }
      }
    }
  ]
}

FILES TO REVIEW:
${filesText}

Return ONLY the JSON. Nothing else.`;

  return { systemPrompt, userPrompt };
};

const buildUnifiedRepoPrompt = ({ filesText, commitCount, studentLevel, reviewDepth, strictnessLevel, focusAreas, assignmentContext, customInstructions }) => {
  // We can assume TS/React rules if they exist in the repo
  let isReact = filesText.includes("import React") || filesText.includes("useState");
  let isTS = filesText.includes("interface ") || filesText.includes("type ");
  
  let repoRules = "";
  if (isReact) repoRules += frameworkGuide["react"] + " ";
  if (isTS) repoRules += frameworkGuide["typescript"] + " ";

  const systemPrompt = `You are a Senior Software Architect reviewing a GitHub repository.
You will evaluate the ENTIRE repository code provided.

STUDENT LEVEL: ${studentLevel}
REVIEW DEPTH: ${reviewDepth}
STRICTNESS: ${strictnessLevel}
${repoRules.trim() ? `${repoRules.trim()}` : ""}
${focusAreas && focusAreas.length > 0 ? `FOCUS AREAS: ${focusAreas.join(", ")}` : ""}
${assignmentContext ? `ASSIGNMENT CONTEXT: ${assignmentContext}` : ""}
${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}

REPOSITORY METADATA:
- Total Commits in GitHub: ${commitCount}

CRITICAL OUTPUT RULES:
1. Respond ONLY with a valid JSON object — no text before or after
2. Never include markdown code fences like \`\`\`json
3. All fields must be present
4. overallVerdict.label must be one of: EXCELLENT, GOOD, NEEDS_WORK, REDO`;

  const userPrompt = `Here is the code for the entire repository:

${filesText}

Based on this code and the REPOSITORY METADATA, generate an overall repository review in JSON format with EXACTLY this structure:
{
  "summary": "Overall 2-3 sentence summary of the repository's code quality",
  "examinerFeedback": "Markdown string formatted as an Examiner's Feedback checklist. CRITICAL: You MUST read the CUSTOM INSTRUCTIONS. If the user provided a list of requirements or points, you MUST evaluate the ENTIRE REPOSITORY STRICTLY against those exact points. Keep the exact section headers and numbering provided by the user. If any point asks to check GitHub commits (e.g. 'Minimum 5 GitHub Commits'), you MUST use the REPOSITORY METADATA commit count (${commitCount}) to determine if it passes. For each point, append ' - okay।' if the repository satisfies it, or ' - needs improvement।' if it fails.",
  "overallVerdict": {
    "label": "EXCELLENT|GOOD|NEEDS_WORK|REDO",
    "score": 85,
    "justification": "Why this score."
  }
}

Return ONLY the JSON. Nothing else.`;

  return { systemPrompt, userPrompt };
};

module.exports = { build, buildBatch, buildUnifiedRepoPrompt };

