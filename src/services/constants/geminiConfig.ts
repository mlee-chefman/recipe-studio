// Gemini API configuration for recipe parsing
export const GEMINI_RECIPE_CONFIG = {
  // API endpoint
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',

  // Text chunking settings
  TEXT_CHUNK_SIZE: 6000,
  TEXT_CHUNK_OVERLAP: 1000,
  MIN_FINAL_CHUNK_SIZE: 500,

  // API settings
  TEMPERATURE: 0.1, // Low temperature for thorough extraction
  MAX_OUTPUT_TOKENS: 16384,
  TOP_P: 0.95,
  TOP_K: 40,
  TIMEOUT_MS: 120000, // 2 minutes per chunk

  // Rate limiting
  DELAY_BETWEEN_CHUNKS_MS: 3000,
  RATE_LIMIT_RETRY_DELAY_MS: 10000,

  // Recipe estimation (avg characters per recipe)
  AVG_CHARS_PER_RECIPE: 1200,
} as const;
