import axios from 'axios';
import { GEMINI_API_CONFIG, PDF_EXTRACTION_CONFIG, EXTRACTION_PROMPTS } from '../constants/pdfExtraction';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Extract text from a PDF chunk using Gemini API
 */
export async function extractTextFromPDFChunk(
  base64Data: string,
  chunkNumber: number,
  totalChunks: number
): Promise<string> {
  const base64SizeMB = (base64Data.length / 1024 / 1024).toFixed(2);
  console.log(`Extracting text from chunk ${chunkNumber}/${totalChunks} (${base64SizeMB}MB)...`);

  try {
    const response = await axios.post(
      `${GEMINI_API_CONFIG.API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: EXTRACTION_PROMPTS.PDF_CHUNK,
              },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: PDF_EXTRACTION_CONFIG.TEMPERATURE,
          maxOutputTokens: PDF_EXTRACTION_CONFIG.MAX_OUTPUT_TOKENS,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: PDF_EXTRACTION_CONFIG.API_TIMEOUT_MS,
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`Chunk ${chunkNumber}: Extracted ${extractedText.length} characters`);

    return extractedText;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error(`API Error ${status} for chunk ${chunkNumber}: ${errorMsg}`);
      console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    }
    throw error;
  }
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
