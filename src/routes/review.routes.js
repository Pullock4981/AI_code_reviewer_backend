const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { validateReview, validateGithubFile, validateGithubRepo, validateUIReview } = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/review.controller");

// POST /api/v1/reviews          — code paste/file review
router.post("/",              validateReview,      ctrl.createReview);

// POST /api/v1/reviews/github/file — single GitHub file
router.post("/github/file",   validateGithubFile,  ctrl.reviewGithubFile);

// POST /api/v1/reviews/github/repo — full GitHub repo
router.post("/github/repo",   validateGithubRepo,  ctrl.reviewGithubRepo);

// POST /api/v1/reviews/ui — live url UI review
router.post("/ui",            validateUIReview,    ctrl.reviewUI);

// GET  /api/v1/reviews/:id      — fetch saved review
router.get("/:id",                                 ctrl.getReview);

module.exports = router;
