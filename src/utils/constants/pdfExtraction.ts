// PDF extraction configuration
export const PDF_EXTRACTION_CONFIG = {
  // Pages per chunk - keep small to avoid 400 errors (file size limit)
  PAGES_PER_CHUNK: 8,

  // Delay between API calls to avoid rate limiting
  DELAY_BETWEEN_CHUNKS_MS: 4000,

  // Retry delay when rate limited
  RATE_LIMIT_RETRY_DELAY_MS: 10000,

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
