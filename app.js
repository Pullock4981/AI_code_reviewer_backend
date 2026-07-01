const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "AI Code Reviewer API is running on Vercel 🚀" });
});
app.use("/health",    require("./src/routes/health.routes"));
app.use("/api/v1",    require("./src/routes/index"));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
});

// Global error handler
app.use(require("./src/middlewares/error.middleware"));

module.exports = app;
