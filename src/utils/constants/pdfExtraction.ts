// PDF extraction configuration
// Optimized for paid Gemini account (1000 RPM)
export const PDF_EXTRACTION_CONFIG = {
  // Pages per chunk - increased for faster processing with paid tier
  PAGES_PER_CHUNK: 12,

  // Delay between API calls (reduced for paid tier: 1000 RPM = ~60ms minimum, using 500ms for safety)
  DELAY_BETWEEN_CHUNKS_MS: 500,

  // Retry delay when rate limited (reduced for paid tier)
  RATE_LIMIT_RETRY_DELAY_MS: 3000,

  // API timeout
  API_TIMEOUT_MS: 180000, // 3 minutes

  // Maximum output tokens per chunk
  MAX_OUTPUT_TOKENS: 8192,

  // Temperature for extraction (0.0 = deterministic)
  TEMPERATURE: 0.0,
} as const;

// API configuration
export const GEMINI_API_CONFIG = {
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
} as const;

// Extraction prompts
export const EXTRACTION_PROMPTS = {
  PDF_CHUNK: 'Extract ALL text from this PDF. Return ONLY the raw text content, no commentary or formatting. Extract everything you see.',
} as const;
