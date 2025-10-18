import { PDFDocument } from 'pdf-lib';
import { uint8ArrayToBase64 } from './base64';

export interface PDFChunk {
  base64: string;
  startPage: number;
  endPage: number;
  sizeBytes: number;
  sizeMB: string;
}

/**
 * Split PDF into smaller chunks (separate PDF files)
 * @param pdfBytes - The PDF file as Uint8Array
 * @param pagesPerChunk - Number of pages per chunk
 * @returns Array of PDF chunks with metadata
 */
export async function splitPDFIntoChunks(
  pdfBytes: Uint8Array,
  pagesPerChunk: number
): Promise<PDFChunk[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  console.log(`PDF has ${totalPages} pages, splitting into chunks of ${pagesPerChunk} pages`);

  const chunks: PDFChunk[] = [];

  for (let startPage = 0; startPage < totalPages; startPage += pagesPerChunk) {
    const endPage = Math.min(startPage + pagesPerChunk, totalPages);

    // Create a new PDF document for this chunk
    const chunkDoc = await PDFDocument.create();

    // Copy pages from original PDF to chunk
    const pageIndices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
    const copiedPages = await chunkDoc.copyPages(pdfDoc, pageIndices);

    copiedPages.forEach(page => {
      chunkDoc.addPage(page);
    });

    // Save the chunk as bytes and convert to base64
    const chunkBytes = await chunkDoc.save();
    const base64Chunk = uint8ArrayToBase64(chunkBytes);
    const sizeMB = (chunkBytes.length / 1024 / 1024).toFixed(2);

    console.log(`Created chunk with pages ${startPage + 1}-${endPage} (${sizeMB}MB)`);

    // Warn if chunk is very large (Gemini has ~20MB request limit)
    if (chunkBytes.length > 15 * 1024 * 1024) { // 15MB
      console.warn(`⚠️ Chunk ${chunks.length + 1} is very large (${sizeMB}MB) - may fail`);
    }

    chunks.push({
      base64: base64Chunk,
      startPage: startPage + 1,
      endPage,
      sizeBytes: chunkBytes.length,
      sizeMB,
    });
  }

  return chunks;
}
