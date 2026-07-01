const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FALLBACK_MODEL } = require("../../config/env");
const logger = require("../../utils/logger");
const AiError = require("../../utils/AiError");

class GeminiClient {
  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.primaryModel = GEMINI_MODEL || "gemini-2.5-flash";
    this.fallbackModel = GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
    
    // Retry configurations
    this.maxRetries = 3;
    this.baseDelay = 2000; // 2 seconds
    this.retryableStatuses = [429, 500, 502, 503, 504];
  }

  /**
   * Helper to execute with exponential backoff and retries
   */
  async _executeWithRetry(modelName, promptData) {
    const { systemPrompt, userPrompt } = promptData;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const startTime = Date.now();
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();
        
        logger.info(`Successfully generated content using ${modelName}`, {
          model: modelName,
          responseTimeMs: Date.now() - startTime,
          retryCount: attempt,
        });

        return text;
      } catch (error) {
        const status = error.status || (error.response && error.response.status);
        const isRetryable = this.retryableStatuses.includes(status) || error.message.includes("503");

        logger.error(`Error generating content with ${modelName}`, {
          model: modelName,
          error: error.message,
          status,
          attempt,
          retryable: isRetryable
        });

        if (!isRetryable || attempt === this.maxRetries) {
          throw new AiError({
            message: error.message,
            errorType: isRetryable ? "TEMPORARY_FAILURE" : "NON_RETRYABLE_ERROR",
            retryable: isRetryable,
            originalError: error,
          });
        }

        // Calculate backoff: 2s, 5s, 10s (approximate using exponential formula)
        // 1st retry: 2000ms
        // 2nd retry: 5000ms
        // 3rd retry: 10000ms
        const delay = attempt === 0 ? 2000 : attempt === 1 ? 5000 : 10000;
        attempt++;
        
        logger.info(`Retrying in ${delay}ms... (Attempt ${attempt} of ${this.maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Generates review with primary model, then falls back if primary fails completely
   */
  async complete(promptData) {
    try {
      return await this._executeWithRetry(this.primaryModel, promptData);
    } catch (primaryError) {
      logger.warn(`Primary model ${this.primaryModel} failed after retries. Falling back to ${this.fallbackModel}...`, {
        error: primaryError.message,
      });

      try {
        // Attempt with fallback model
        return await this._executeWithRetry(this.fallbackModel, promptData);
      } catch (fallbackError) {
        logger.error(`Fallback model ${this.fallbackModel} also failed.`, {
          error: fallbackError.message,
        });
        throw new AiError({
          message: `Both primary (${this.primaryModel}) and fallback (${this.fallbackModel}) models failed.`,
          errorType: "ALL_MODELS_FAILED",
          retryable: false,
          originalError: fallbackError,
        });
      }
    }
  }

  async healthCheck() {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.primaryModel });
      await model.generateContent("ping");
      return true;
    } catch (err) {
      logger.error("Health check failed", { error: err.message });
      return false;
    }
  }
}

module.exports = new GeminiClient();
