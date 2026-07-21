const reviewService = require("../services/review.service");
const uiReviewService = require("../services/ui-review.service");
const { success, error } = require("../utils/responseHelper");

// POST /api/v1/reviews
const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.processReview(req.body);
    res.status(201).json(success(review, "Review completed"));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/reviews/github/file
const reviewGithubFile = async (req, res, next) => {
  try {
    const review = await reviewService.processGithubFileReview(req.body);
    res.status(201).json(success(review, "GitHub file review completed"));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/reviews/github/repo
const reviewGithubRepo = async (req, res, next) => {
  try {
    const result = await reviewService.processGithubRepoReview(req.body);
    res.status(201).json(success(result, "Repository review completed"));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/reviews/ui
const reviewUI = async (req, res, next) => {
  try {
    const result = await uiReviewService.processUIReview(req.body);
    res.status(201).json(success(result, "UI review completed"));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reviews/:id
const getReview = async (req, res, next) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    res.status(200).json(success(review));
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, reviewGithubFile, reviewGithubRepo, reviewUI, getReview };
