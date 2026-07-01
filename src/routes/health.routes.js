const router = require("express").Router();
const aiProvider = require("../services/ai/aiProvider");
const { success } = require("../utils/responseHelper");

router.get("/", async (req, res) => {
  res.status(200).json(
    success({
      status: "healthy",
      provider: aiProvider.getProviderName(),
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = router;
