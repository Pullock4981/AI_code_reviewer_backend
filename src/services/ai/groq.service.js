const Groq = require("groq-sdk");
const { GROQ_API_KEY, GROQ_MODEL } = require("../../config/env");

const client = new Groq({ apiKey: GROQ_API_KEY });

const complete = async ({ systemPrompt, userPrompt }) => {
  const response = await client.chat.completions.create({
    model: GROQ_MODEL || "llama3-70b-8192",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });
  return response.choices[0].message.content;
};

const healthCheck = async () => {
  try {
    await client.chat.completions.create({
      model: GROQ_MODEL || "llama3-70b-8192",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });
    return true;
  } catch { return false; }
};

module.exports = { complete, healthCheck };
