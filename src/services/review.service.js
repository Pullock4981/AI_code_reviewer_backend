const Review = require("../models/review.model");
const promptService = require("./prompt.service");
const aiProvider = require("./ai/aiProvider");
const githubService = require("./github.service");
const { detect } = require("../utils/languageDetector");

// AI response parse kore safe JSON banay
const parseAIResponse = (raw) => {
  try {
    if (!raw) throw new Error("Empty response from AI");
    
    let cleaned = raw.trim();
    
    // Find the first { or [ and the last } or ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = firstBrace;
    if (firstBrace === -1) startIdx = firstBracket;
    else if (firstBracket !== -1 && firstBracket < firstBrace) startIdx = firstBracket;
    
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    let endIdx = lastBrace;
    if (lastBrace === -1) endIdx = lastBracket;
    else if (lastBracket !== -1 && lastBracket > lastBrace) endIdx = lastBracket;
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ AI returned invalid JSON. Raw output was:", raw);
    throw new Error("AI returned invalid JSON. Please try again.");
  }
};

const adjustScoreBasedOnFeedback = (reviewObject) => {
  if (reviewObject && reviewObject.examinerFeedback) {
    const fb = reviewObject.examinerFeedback.toLowerCase();
    const okayCount = (fb.match(/- okay/g) || []).length;
    const improvementCount = (fb.match(/- needs improvement/g) || []).length;
    const totalPoints = okayCount + improvementCount;
    if (totalPoints > 0) {
      if (!reviewObject.overallVerdict) reviewObject.overallVerdict = {};
      reviewObject.overallVerdict.score = Math.round((okayCount / totalPoints) * 100);
    }
  }
  return reviewObject;
};

// ─── Single file / paste review ───────────────────────────────────────────────
const processReview = async (body) => {
  const {
    code, language: langOverride,
    studentLevel, reviewDepth,
    strictnessLevel = "STANDARD",
    focusAreas = [], assignmentContext = "",
    customInstructions = "", inputMethod = "PASTE",
  } = body;

  const startTime = Date.now();
  const language = langOverride || detect(code);

  const prompt = promptService.build({
    code, language, studentLevel, reviewDepth,
    strictnessLevel, focusAreas, assignmentContext, customInstructions,
  });

  let aiRaw;
  try {
    aiRaw = await aiProvider.complete(prompt);
  } catch (err) {
    throw new Error(`AI provider failed: ${err.message}`);
  }

  let parsed = parseAIResponse(aiRaw);
  parsed = adjustScoreBasedOnFeedback(parsed);
  const durationMs = Date.now() - startTime;

  const review = await Review.create({
    code, language, inputMethod,
    studentLevel, reviewDepth, strictnessLevel,
    focusAreas, assignmentContext, customInstructions,
    ...parsed,
    aiProvider: aiProvider.getProviderName(),
    durationMs,
    status: "COMPLETED",
  });

  return review;
};

// ─── GitHub single file review ────────────────────────────────────────────────
const processGithubFileReview = async (body) => {
  const { githubUrl, accessToken, ...params } = body;

  const code = await githubService.fetchFile(githubUrl, accessToken);
  const filename = githubUrl.split("/").pop();
  const language = detect(code, filename);

  return processReview({ ...params, code, language, inputMethod: "GITHUB_FILE" });
};

// ─── GitHub full repo review ──────────────────────────────────────────────────
const processGithubRepoReview = async (body) => {
  const { repositoryUrl, accessToken, maxFiles = 20, ...params } = body;

  const filesMeta = await githubService.listRepoFiles(repositoryUrl, accessToken, maxFiles);
  if (filesMeta.length === 0) throw new Error("No supported source files found in repository");

  const axios = require("axios");
  const results = [];
  
  // Download files in parallel to save time
  const downloadPromises = filesMeta.map(async (file) => {
    try {
      const code = await axios.get(file.rawUrl, { timeout: 10000 }).then((r) => r.data);
      const language = detect(code, file.path);
      return { path: file.path, code, language };
    } catch (err) {
      results.push({ file: file.path, error: "Failed to download file: " + err.message });
      return null;
    }
  });
  
  const downloadedFiles = (await Promise.all(downloadPromises)).filter(Boolean);

  const commitCount = await githubService.getRepoCommitCount(repositoryUrl, accessToken);
  
  const filesText = downloadedFiles.map(f => `--- FILE: ${f.path} ---\n\`\`\`${f.language}\n${f.code}\n\`\`\``).join('\n\n');
  
  let repoSummary = null;
  let reviewDoc = null;
  try {
    const prompt = promptService.buildUnifiedRepoPrompt({
      filesText,
      commitCount,
      studentLevel: params.studentLevel,
      reviewDepth: params.reviewDepth,
      strictnessLevel: params.strictnessLevel,
      focusAreas: params.focusAreas,
      assignmentContext: params.assignmentContext,
      customInstructions: params.customInstructions
    });
    const aiRaw = await aiProvider.complete(prompt);
    let parsedSummary = parseAIResponse(aiRaw);
    repoSummary = adjustScoreBasedOnFeedback(parsedSummary);
    
    // Save a single unified review document for history
    reviewDoc = await Review.create({
      code: "GITHUB_REPO: " + repositoryUrl,
      language: "multi",
      inputMethod: "GITHUB_REPO",
      studentLevel: params.studentLevel,
      reviewDepth: params.reviewDepth,
      strictnessLevel: params.strictnessLevel,
      focusAreas: params.focusAreas,
      assignmentContext: params.assignmentContext,
      customInstructions: params.customInstructions,
      summary: repoSummary.summary,
      examinerFeedback: repoSummary.examinerFeedback,
      overallVerdict: repoSummary.overallVerdict || { label: "GOOD", score: 80, justification: "Combined repository score" },
      aiProvider: aiProvider.getProviderName(),
      status: "COMPLETED",
    });
    
  } catch (err) {
    console.error("Failed to generate unified repo summary:", err.message);
    throw new Error(`Failed to generate review: ${err.message}`);
  }

  // Populate results array with just file names (no reviewId/verdict needed anymore)
  for (const f of downloadedFiles) {
    results.push({ file: f.path });
  }

  return { 
    _id: reviewDoc ? reviewDoc._id : null,
    totalFiles: filesMeta.length, 
    reviewed: downloadedFiles.length, 
    repoSummary, 
    files: results 
  };
};


// ─── Get review by ID ────────────────────────────────────────────────────────
const getReviewById = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review not found");
  return review;
};

module.exports = { processReview, processGithubFileReview, processGithubRepoReview, getReviewById };
