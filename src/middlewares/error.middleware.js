const { error } = require("../utils/responseHelper");

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  if (err.name === "CastError") {
    return res.status(400).json(error("Invalid ID format", "VALIDATION_ERROR"));
  }
  if (err.name === "ValidationError") {
    return res.status(422).json(error(err.message, "VALIDATION_ERROR"));
  }
  if (err.message?.includes("not found")) {
    return res.status(404).json(error(err.message, "NOT_FOUND"));
  }
  if (err.message?.includes("GitHub")) {
    return res.status(502).json(error(err.message, "GITHUB_ERROR"));
  }
  if (err.message?.includes("AI provider")) {
    return res.status(503).json(error(err.message, "AI_PROVIDER_ERROR"));
  }

  console.error("Global Error:", err);
  res.status(500).json(error(err.message || "Something went wrong", "SERVER_ERROR"));
};

module.exports = errorHandler;
