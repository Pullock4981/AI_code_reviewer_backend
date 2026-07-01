const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  type:        String,
  severity:    String,
  title:       String,
  description: String,
  lineNumbers: [Number],
  suggestion:  String,
});

const securityFindingSchema = new mongoose.Schema({
  type:        String,
  severity:    String,
  description: String,
  remediation: String,
});

const reviewSchema = new mongoose.Schema(
  {
    // Input
    code:             { type: String, required: true },
    language:         { type: String, default: "unknown" },
    inputMethod:      { type: String, enum: ["PASTE","FILE","GITHUB_FILE","GITHUB_REPO"], default: "PASTE" },

    // Parameters
    studentLevel:     { type: String, enum: ["BEGINNER","INTERMEDIATE","ADVANCED"], required: true },
    reviewDepth:      { type: String, enum: ["QUICK","STANDARD","DETAILED"], required: true },
    strictnessLevel:  { type: String, enum: ["LENIENT","STANDARD","STRICT"], default: "STANDARD" },
    focusAreas:       [String],
    assignmentContext:String,
    customInstructions: String,

    // Output
    summary:          String,
    examinerFeedback: String,
    codeExplanation:  {
      overview:       String,
      keyComponents:  [{ name: String, description: String }],
    },
    positiveFindings: [{ title: String, description: String, lineNumbers: [Number] }],
    issues:           [issueSchema],
    improvements:     [{ title: String, description: String, codeExample: String }],
    securityReview:   {
      overallRisk:  { type: String, enum: ["NONE","LOW","MEDIUM","HIGH","CRITICAL"] },
      findings:     [securityFindingSchema],
    },
    performanceReview: {
      overallRating: { type: String, enum: ["EXCELLENT","GOOD","FAIR","POOR"] },
      findings:      [{ description: String, impact: String, suggestion: String }],
    },
    codeSmells:       [{ type: { type: String }, description: String, location: String }],
    overallVerdict:   {
      label:        { type: String, enum: ["EXCELLENT","GOOD","NEEDS_WORK","REDO"] },
      score:        Number,
      justification:String,
    },

    // Meta
    aiProvider:  { type: String, default: "gemini" },
    durationMs:  Number,
    status:      { type: String, enum: ["COMPLETED","PARTIAL","FAILED"], default: "COMPLETED" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
