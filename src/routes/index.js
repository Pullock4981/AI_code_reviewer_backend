const router = require("express").Router();

router.use("/reviews", require("./review.routes"));

module.exports = router;
