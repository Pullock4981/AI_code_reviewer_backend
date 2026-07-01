const { z } = require("zod");
const { error } = require("../utils/responseHelper");

const reviewParamsSchema = z.object({
  studentLevel:     z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  reviewDepth:      z.enum(["QUICK", "STANDARD", "DETAILED"]),
  strictnessLevel:  z.enum(["LENIENT", "STANDARD", "STRICT"]).optional(),
  focusAreas:       z.array(z.string()).max(5).optional(),
  assignmentContext:z.string().max(2000).optional(),
  customInstructions: z.string().max(1000).optional(),
});

const reviewSchema = z.object({
  code:             z.string().min(1, "Code is required").max(50000, "Code too long (max 50,000 chars)"),
  language:         z.string().max(50).optional(),
  reviewParameters: reviewParamsSchema,
});

const githubFileSchema = z.object({
  githubUrl:        z.string().url().includes("github.com"),
  accessToken:      z.string().optional(),
  reviewParameters: reviewParamsSchema,
});

const githubRepoSchema = z.object({
  repositoryUrl:    z.string().url().includes("github.com"),
  accessToken:      z.string().optional(),
  maxFiles:         z.number().max(30).optional(),
  reviewParameters: reviewParamsSchema,
});

// Flatten reviewParameters into body before service call
const flattenParams = (body) => {
  const { reviewParameters, ...rest } = body;
  return { ...rest, ...reviewParameters };
};

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join("."),
      issue: e.message,
    }));
    return res.status(422).json(error("Validation failed", "VALIDATION_ERROR", details));
  }
  req.body = flattenParams(result.data);
  next();
};

module.exports = {
  validateReview:       validate(reviewSchema),
  validateGithubFile:   validate(githubFileSchema),
  validateGithubRepo:   validate(githubRepoSchema),
};
