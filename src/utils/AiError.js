class AiError extends Error {
  constructor({ message, errorType, retryable = false, originalError = null }) {
    super(message);
    this.name = "AiError";
    this.success = false;
    this.errorType = errorType;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

module.exports = AiError;
