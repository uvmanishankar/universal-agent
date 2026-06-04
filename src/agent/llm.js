require('dotenv').config();
const OpenAI = require('openai');

let _client = null;

function getClient() {
  if (_client) return _client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Please add it to your .env file or environment.');
  }

  _client = new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  });

  return _client;
}

const MODE_INSTRUCTIONS = {
  solution: 'Provide a direct, working solution to the problem or code visible on screen. Include complete code if applicable.',
  explanation: 'Explain what is shown on the screen clearly and concisely. Break down complex concepts into simple terms, step-by-step.',
};

/**
 * Query the LLM with screen context.
 * @param {{ context: object, mode: string, userPrompt: string }} params
 * @returns {string} AI response
 */
async function query({ context, mode = 'solution', userPrompt = '' }) {
  const modeInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.solution;

  const systemPrompt = `You are a universal desktop AI assistant. You analyze visible screen content and help users understand, learn, and work more efficiently.

Your task: ${modeInstruction}

Guidelines:
- Be concise but thorough
- Use markdown formatting for readability (headers, code blocks, bullet points)
- If code is visible, preserve its formatting
- If the screen content is unclear or incomplete, say so
- Focus on what's actually visible, not assumptions`;

  const userContent = buildUserContent(context, userPrompt);
  const client = getClient();
  const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
  const maxTokens = parseInt(process.env.MAX_TOKENS || '1500', 10);

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || 'No response received.';
}

function buildUserContent(context, userPrompt) {
  const parts = [];

  if (context?.app && context.app !== 'Unknown') {
    parts.push(`**Active Application:** ${context.app}`);
  }
  if (context?.title && context.title !== 'Unknown') {
    parts.push(`**Window Title:** ${context.title}`);
  }
  if (context?.domContent) {
    parts.push(`\n**Browser Content:**\n\`\`\`\n${context.domContent.slice(0, 4000)}\n\`\`\``);
  }
  if (userPrompt) {
    parts.push(`\n**User Request:** ${userPrompt}`);
  }

  return parts.join('\n') || 'No screen context available. Please capture the screen first.';
}

module.exports = { query };
