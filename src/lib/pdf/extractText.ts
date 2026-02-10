import pdf from "pdf-parse";

const MAX_EXTRACTED_LENGTH = 50_000;

/**
 * Extract plain text from a PDF buffer.
 * Returns at most 50 000 characters.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const result = await pdf(buffer);
    const text = result.text;

    if (!text || text.trim().length === 0) {
      throw new Error(
        "The PDF appears to be empty or contains no extractable text."
      );
    }

    return text.trim().slice(0, MAX_EXTRACTED_LENGTH);
  } catch (err) {
    console.error("[extractPdfText] Error:", err);
    throw err;
  }
}
