import axios from 'axios';
import { GEMINI_RECIPE_CONFIG } from '../constants/geminiConfig';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Call Gemini API with given prompt
 */
export async function callGeminiAPI(
  prompt: string,
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    timeout?: number;
  }
): Promise<GeminiResponse> {
  const response = await axios.post(
    `${GEMINI_RECIPE_CONFIG.API_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: config?.temperature ?? GEMINI_RECIPE_CONFIG.TEMPERATURE,
        maxOutputTokens: config?.maxOutputTokens ?? GEMINI_RECIPE_CONFIG.MAX_OUTPUT_TOKENS,
        topP: GEMINI_RECIPE_CONFIG.TOP_P,
        topK: GEMINI_RECIPE_CONFIG.TOP_K,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: config?.timeout ?? GEMINI_RECIPE_CONFIG.TIMEOUT_MS,
    }
  );

  return response.data;
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
