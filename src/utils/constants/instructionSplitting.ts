/**
 * Configuration constants for instruction splitting
 */

/**
 * Thresholds for determining when instructions should be split
 */
export const INSTRUCTION_SPLIT_THRESHOLDS = {
  // Maximum character length before considering splitting for 1-2 instructions
  LONG_INSTRUCTION_CHARS: 500,

  // Maximum character length before considering splitting for 3 instructions
  VERY_LONG_INSTRUCTION_CHARS: 800,

  // Maximum number of instructions before we don't bother splitting
  MAX_INSTRUCTIONS_TO_SPLIT: 3,
} as const;

/**
 * Gemini API configuration for instruction splitting
 */
export const INSTRUCTION_SPLIT_CONFIG = {
  // Temperature for consistent, deterministic splitting
  TEMPERATURE: 0.1,

  // Maximum tokens for the response
  MAX_OUTPUT_TOKENS: 4096,

  // Timeout for API call (30 seconds)
  TIMEOUT_MS: 30000,
} as const;

/**
 * Prompt template for Gemini instruction splitting
 */
export const INSTRUCTION_SPLIT_PROMPT = (instructionsText: string): string => `You are a recipe instruction parser. The following text contains recipe instructions that need to be split into clear, logical steps.

Instructions text:
${instructionsText}

Please split this into individual cooking steps. Each step should be a clear, actionable instruction.

Rules:
1. Split based on logical cooking actions (e.g., "preheat oven", "mix ingredients", "bake for 30 minutes")
2. Keep related actions together in one step
3. Maintain the original order
4. Don't add new instructions or change the meaning
5. Each step should be concise but complete

Return ONLY a JSON array of strings, where each string is one step. Example format:
["Step 1 text", "Step 2 text", "Step 3 text"]`;
