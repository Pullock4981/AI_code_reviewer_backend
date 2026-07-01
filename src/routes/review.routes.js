const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { validateReview, validateGithubFile, validateGithubRepo } = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/review.controller");

// POST /api/v1/reviews          — code paste/file review
router.post("/",              auth, validateReview,      ctrl.createReview);

// POST /api/v1/reviews/github/file — single GitHub file
router.post("/github/file",   auth, validateGithubFile,  ctrl.reviewGithubFile);

// POST /api/v1/reviews/github/repo — full GitHub repo
router.post("/github/repo",   auth, validateGithubRepo,  ctrl.reviewGithubRepo);

// GET  /api/v1/reviews/:id      — fetch saved review
router.get("/:id",            auth,                      ctrl.getReview);

module.exports = router;
