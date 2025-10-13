import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export interface PDFTextResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Extract text from PDF file using Gemini API (which can read PDFs directly)
 * @param fileUri - Local file URI of the PDF
 * @returns PDFTextResult with extracted text
 */
export async function extractTextFromPDF(fileUri: string): Promise<PDFTextResult> {
  try {
    if (!GEMINI_API_KEY) {
      return {
        text: '',
        success: false,
        error: 'Gemini API key is not configured.',
      };
    }

    // Read the PDF file as base64
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Call Gemini API with the PDF file
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Extract all text from this PDF file. Return the raw text content without any additional formatting or commentary. Just the text as it appears in the PDF.`,
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
          temperature: 0.1, // Very low temperature for accurate extraction
          maxOutputTokens: 8192,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for larger PDFs
      }
    );

    const data = response.data;

    // Check for API errors
    if (data.error) {
      return {
        text: '',
        success: false,
        error: `Gemini API error: ${data.error.message}`,
      };
    }

    // Extract the text
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        text: '',
        success: false,
        error: 'No text could be extracted from the PDF.',
      };
    }

    return {
      text: extractedText,
      success: true,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 429) {
        return {
          text: '',
          success: false,
          error: 'API rate limit exceeded. Please try again in a moment.',
        };
      }

      if (status === 413) {
        return {
          text: '',
          success: false,
          error: 'PDF file is too large. Please try a smaller file or fewer pages.',
        };
      }

      return {
        text: '',
        success: false,
        error: `API error: ${message}`,
      };
    }

    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
