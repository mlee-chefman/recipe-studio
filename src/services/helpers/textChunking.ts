import { GEMINI_RECIPE_CONFIG } from '../constants/geminiConfig';

/**
 * Split text into overlapping chunks for processing
 * @param text - The text to split
 * @param maxChunkSize - Maximum size of each chunk (default from config)
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = GEMINI_RECIPE_CONFIG.TEXT_CHUNK_SIZE
): string[] {
  const chunks: string[] = [];
  const overlapSize = GEMINI_RECIPE_CONFIG.TEXT_CHUNK_OVERLAP;
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + maxChunkSize, text.length);
    const chunk = text.substring(startIndex, endIndex);
    chunks.push(chunk);

    // Move forward, accounting for overlap
    startIndex += (maxChunkSize - overlapSize);

    // If remaining text is small, add it as final chunk and break
    if (text.length - startIndex <= maxChunkSize) {
      if (startIndex < text.length) {
        const finalChunk = text.substring(startIndex);
        if (finalChunk.length > GEMINI_RECIPE_CONFIG.MIN_FINAL_CHUNK_SIZE) {
          chunks.push(finalChunk);
        }
      }
      break;
    }
  }

  return chunks;
}

/**
 * Log chunk information for debugging
 */
export function logChunkInfo(chunks: string[]): void {
  console.log(`Text is ${chunks.reduce((sum, c) => sum + c.length, 0)} characters, splitting into chunks of ${GEMINI_RECIPE_CONFIG.TEXT_CHUNK_SIZE} with ${GEMINI_RECIPE_CONFIG.TEXT_CHUNK_OVERLAP} char overlap`);

  chunks.forEach((chunk, index) => {
    const chunkNum = index + 1;
    const startChar = chunks.slice(0, index).reduce((sum, c) => sum + c.length - GEMINI_RECIPE_CONFIG.TEXT_CHUNK_OVERLAP, 0);

    if (index === chunks.length - 1 && chunk.length < GEMINI_RECIPE_CONFIG.TEXT_CHUNK_SIZE) {
      console.log(`Created final chunk ${chunkNum}: starts at char ${startChar}, length ${chunk.length}`);
    } else {
      console.log(`Created chunk ${chunkNum}: starts at char ${startChar}, length ${chunk.length}`);
    }
  });

  console.log(`Created ${chunks.length} overlapping chunks`);
}

/**
 * Estimate number of recipes in text
 */
export function estimateRecipeCount(text: string): number {
  return Math.round(text.length / GEMINI_RECIPE_CONFIG.AVG_CHARS_PER_RECIPE);
}
