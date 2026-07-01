const { API_AUTH_KEY } = require("../config/env");
const { error } = require("../utils/responseHelper");

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["x-api-key"];

  if (!authHeader) {
    return res.status(401).json(error("API key missing", "AUTH_ERROR"));
  }

  const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (key !== API_AUTH_KEY) {
    return res.status(401).json(error("Invalid API key", "AUTH_ERROR"));
  }

  next();
};

module.exports = auth;
