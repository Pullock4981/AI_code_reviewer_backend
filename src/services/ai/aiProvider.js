const { AI_PROVIDER } = require("../../config/env");
const gemini = require("./geminiClient");
const groq   = require("./groq.service");

const providers = {
  gemini,
  groq,
};

const getProvider = () => {
  const provider = providers[AI_PROVIDER];
  if (!provider) throw new Error(`AI provider "${AI_PROVIDER}" not supported`);
  return provider;
};

const logger = require("../../utils/logger");

const complete = async (prompt) => {
  const provider = getProvider();
  try {
    return await provider.complete(prompt);
  } catch (error) {
    logger.error(`Primary provider ${AI_PROVIDER} failed: ${error.message}`);
    
    // Cross-provider fallback
    const fallbackProviderName = AI_PROVIDER === "gemini" ? "groq" : "gemini";
    const fallbackProvider = providers[fallbackProviderName];
    
    if (fallbackProvider) {
      logger.warn(`Attempting cross-provider fallback to ${fallbackProviderName}...`);
      try {
        return await fallbackProvider.complete(prompt);
      } catch (fallbackError) {
        logger.error(`Cross-provider fallback ${fallbackProviderName} also failed: ${fallbackError.message}`);
        throw new Error(`All AI providers failed. Primary (${AI_PROVIDER}) error: ${error.message}. Fallback (${fallbackProviderName}) error: ${fallbackError.message}`);
      }
    }
    
    throw error;
  }
};

const healthCheck = async () => {
  const provider = getProvider();
  return provider.healthCheck();
};

module.exports = { complete, healthCheck, getProviderName: () => AI_PROVIDER };
