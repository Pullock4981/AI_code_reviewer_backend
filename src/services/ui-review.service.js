// puppeteer imported dynamically inside processUIReview
const Review = require("../models/review.model");
const aiProvider = require("./ai/aiProvider");

const buildUIPrompt = ({ customInstructions }) => {
  const systemPrompt = `You are an expert UX/UI Designer and Frontend Architect.
Your task is to review the provided screenshot of a website.

CRITICAL OUTPUT RULES:
1. Respond ONLY with a valid JSON object — no text before or after
2. Never include markdown code fences like \`\`\`json
3. overallVerdict.label must be one of: EXCELLENT, GOOD, NEEDS_WORK, REDO`;

  const textPrompt = `Review the provided screenshot of a web UI and return a JSON object with EXACTLY this structure:

{
  "summary": "A precise short summary of the UI design and layout.",
  "examinerFeedback": "Markdown string formatted as an Examiner's Feedback checklist. CRITICAL: You MUST evaluate the UI STRICTLY against the custom instructions. For each point, append ' - okay।' if the UI satisfies it, or ' - needs improvement।' if it fails.",
  "overallVerdict": {
    "label": "EXCELLENT|GOOD|NEEDS_WORK|REDO",
    "score": 85,
    "justification": "Why this score based on the visual design."
  }
}

CUSTOM INSTRUCTIONS: ${customInstructions || "Review the UI for modern design principles, accessibility, color contrast, and spacing."}

Return ONLY the JSON. Nothing else.`;

  return { systemPrompt, textPrompt };
};

const parseAIResponse = (raw) => {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
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

const processUIReview = async (body) => {
  const { liveUrl, ...reviewParameters } = body;
  const startTime = Date.now();

  let browser;
  let screenshotBase64;
  try {
    const puppeteer = (await import("puppeteer")).default;
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(liveUrl, { waitUntil: "networkidle2", timeout: 30000 });
    screenshotBase64 = await page.screenshot({ encoding: "base64", fullPage: true });
  } catch (error) {
    throw new Error(`Failed to capture screenshot from ${liveUrl}: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }

  const { systemPrompt, textPrompt } = buildUIPrompt({ customInstructions: reviewParameters.customInstructions });
  
  // Prepare Gemini vision format
  const imagePart = {
    inlineData: {
      data: screenshotBase64,
      mimeType: "image/png"
    }
  };

  const promptData = {
    systemPrompt,
    userPrompt: [textPrompt, imagePart] // Pass array for Gemini vision
  };

  let aiRaw;
  try {
    aiRaw = await aiProvider.complete(promptData);
  } catch (err) {
    throw new Error(`AI provider failed: ${err.message}`);
  }

  let parsed = parseAIResponse(aiRaw);
  parsed = adjustScoreBasedOnFeedback(parsed);
  const durationMs = Date.now() - startTime;

  const review = await Review.create({
    code: "UI_REVIEW: " + liveUrl,
    language: "image",
    inputMethod: "UI_URL",
    studentLevel: reviewParameters.studentLevel || "INTERMEDIATE",
    reviewDepth: reviewParameters.reviewDepth || "STANDARD",
    strictnessLevel: reviewParameters.strictnessLevel || "STANDARD",
    customInstructions: reviewParameters.customInstructions,
    summary: parsed.summary,
    examinerFeedback: parsed.examinerFeedback,
    overallVerdict: parsed.overallVerdict,
    aiProvider: aiProvider.getProviderName(),
    durationMs,
    status: "COMPLETED",
  });

  return review;
};

module.exports = { processUIReview };
