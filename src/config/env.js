require("dotenv").config();

module.exports = {
  PORT:           process.env.PORT || 5000,
  MONGO_URI:      process.env.MONGO_URI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL:   process.env.GEMINI_MODEL || "gemini-2.0-flash",
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash",
  GROQ_API_KEY:   process.env.GROQ_API_KEY,
  GROQ_MODEL:     process.env.GROQ_MODEL || "llama3-70b-8192",
  API_AUTH_KEY:   process.env.API_AUTH_KEY,
  AI_PROVIDER:    process.env.AI_PROVIDER || "groq",
};
