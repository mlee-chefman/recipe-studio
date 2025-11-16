import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { base64ToUint8Array } from './helpers/base64';
import { splitPDFIntoChunks } from './helpers/pdfSplitter';
import { extractTextFromPDFChunk, delay } from './helpers/geminiPdfApi';
import { PDF_EXTRACTION_CONFIG } from './constants/pdfExtraction';

export interface PDFTextResult {
  text: string;
  success: boolean;
  error?: string;
}

export type PDFExtractionProgressCallback = (
  status: string,
  currentChunk: number,
  totalChunks: number
) => void;

/**
 * Extract text from PDF file using Gemini API
 * Splits large PDFs into smaller chunks for complete extraction
 * @param fileUri - Local file URI of the PDF
 * @param onProgress - Optional callback for progress updates
 * @returns PDFTextResult with extracted text
 */
export async function extractTextFromPDF(
  fileUri: string,
  onProgress?: PDFExtractionProgressCallback
): Promise<PDFTextResult> {
  try {
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

    if (!GEMINI_API_KEY) {
      return {
        text: '',
        success: false,
        error: 'Gemini API key is not configured.',
      };
    }

    // Read the PDF file as base64
    const base64String = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array for pdf-lib
    const pdfBytes = base64ToUint8Array(base64String);

    // Split PDF into smaller chunks
    console.log('Splitting PDF into chunks...');
    onProgress?.('Splitting PDF into pages...', 0, 1);

    const pdfChunks = await splitPDFIntoChunks(pdfBytes, PDF_EXTRACTION_CONFIG.PAGES_PER_CHUNK);
    console.log(`PDF split into ${pdfChunks.length} chunks`);

    // Extract text from each chunk with delay to avoid rate limiting
    const extractedParts: string[] = [];

    for (let i = 0; i < pdfChunks.length; i++) {
      const chunk = pdfChunks[i];

      try {
        onProgress?.(
          `Extracting text from pages (${i + 1}/${pdfChunks.length})...`,
          i,
          pdfChunks.length
        );

        const chunkText = await extractTextFromPDFChunk(chunk.base64, i + 1, pdfChunks.length);

        if (chunkText && chunkText.trim().length > 0) {
          extractedParts.push(chunkText);
        }

        // Add delay between chunks to avoid rate limiting (except after last chunk)
        if (i < pdfChunks.length - 1) {
          console.log(`Waiting ${PDF_EXTRACTION_CONFIG.DELAY_BETWEEN_CHUNKS_MS / 1000} seconds before next chunk...`);
          await delay(PDF_EXTRACTION_CONFIG.DELAY_BETWEEN_CHUNKS_MS);
        }

      } catch (chunkError) {
        console.error(`Error extracting chunk ${i + 1}:`, chunkError);

        // Retry once if rate limited
        if (axios.isAxiosError(chunkError) && chunkError.response?.status === 429) {
          console.log(`Rate limit hit on chunk ${i + 1}, waiting ${PDF_EXTRACTION_CONFIG.RATE_LIMIT_RETRY_DELAY_MS / 1000} seconds before retry...`);
          onProgress?.(
            `Rate limit - waiting before retry (${i + 1}/${pdfChunks.length})...`,
            i,
            pdfChunks.length
          );
          await delay(PDF_EXTRACTION_CONFIG.RATE_LIMIT_RETRY_DELAY_MS);

          try {
            onProgress?.(`Retrying extraction (${i + 1}/${pdfChunks.length})...`, i, pdfChunks.length);
            const chunkText = await extractTextFromPDFChunk(chunk.base64, i + 1, pdfChunks.length);

            if (chunkText && chunkText.trim().length > 0) {
              extractedParts.push(chunkText);
            }
          } catch (retryError) {
            console.error(`Retry failed for chunk ${i + 1}:`, retryError);
            // Continue with other chunks
          }
        }
      }
    }

    // Combine all extracted text
    const combinedText = extractedParts.join('\n\n');

    if (combinedText.trim().length === 0) {
      return {
        text: '',
        success: false,
        error: 'No text could be extracted from the PDF.',
      };
    }

    console.log(`✅ PDF extraction complete: ${extractedParts.length} chunks processed, ${combinedText.length} characters total`);
    console.log(`First 200 characters: ${combinedText.slice(0, 200)}`);
    console.log(`Last 200 characters: ${combinedText.slice(-200)}`);

    return {
      text: combinedText,
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
