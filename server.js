require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/config/db");
const { PORT } = require("./src/config/env");

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base:     http://localhost:${PORT}/api/v1`);
  });
};

start();