require("dotenv").config();
const app = require("../app");
const connectDB = require("../src/config/db");

// Vercel serverless function entrypoint
module.exports = async (req, res) => {
  await connectDB(); // Ensure DB is connected before handling requests
  return app(req, res); // Forward request to Express app
};
