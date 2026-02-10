import { createSupabaseAdmin } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/pdf/extractText";

const BUCKET = "study-materials";

interface ResolveContentInput {
  content?: string;
  fileUrl?: string;
}

interface ResolveContentResult {
  text: string;
  source: "text" | "file";
  fileUrl?: string;
}

/**
 * Resolve the study content from either pasted text or an uploaded PDF.
 *
 * Priority: fileUrl > content.
 * - If `fileUrl` is provided, download the file from Supabase Storage, extract text.
 * - Otherwise fall back to `content`.
 * - If neither is provided, throw.
 */
export async function resolveContent(
  input: ResolveContentInput
): Promise<ResolveContentResult> {
  const { content, fileUrl } = input;

  // ── File URL takes priority ──────────────────────────
  if (fileUrl && typeof fileUrl === "string" && fileUrl.trim().length > 0) {
    // Extract the storage path from the full public URL
    const storagePath = extractStoragePath(fileUrl);
    console.log("[resolveContent] Downloading from storage path:", storagePath);

    const admin = createSupabaseAdmin();

    let data: Blob | null = null;
    let error: Error | null = null;

    try {
      const result = await admin.storage.from(BUCKET).download(storagePath);
      data = result.data;
      error = result.error;
    } catch (downloadErr) {
      console.error("[resolveContent] Supabase download threw:", downloadErr);
      throw new Error(
        `Failed to download file from storage: ${
          downloadErr instanceof Error ? downloadErr.message : "unknown error"
        }`
      );
    }

    if (error || !data) {
      console.error("[resolveContent] Supabase download error:", error);
      throw new Error(
        `Failed to download file from storage: ${error?.message ?? "unknown error"}`
      );
    }

    // Convert Blob → Buffer safely
    let buffer: Buffer;
    try {
      const arrayBuffer = await data.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (bufErr) {
      console.error("[resolveContent] Buffer conversion failed:", bufErr);
      throw new Error("Failed to read the downloaded file into memory.");
    }

    console.log(
      `[resolveContent] Downloaded ${buffer.length} bytes, extracting text…`
    );

    let text: string;
    try {
      text = await extractPdfText(buffer);
    } catch (pdfErr) {
      console.error("[resolveContent] PDF extraction failed:", pdfErr);
      throw new Error(
        `PDF text extraction failed: ${
          pdfErr instanceof Error ? pdfErr.message : "unknown error"
        }`
      );
    }

    return { text, source: "file", fileUrl };
  }

  // ── Fall back to pasted text ─────────────────────────
  if (content && typeof content === "string" && content.trim().length > 0) {
    if (content.length > 50_000) {
      throw new Error("Content is too long. Please limit to 50 000 characters.");
    }
    return { text: content.trim(), source: "text" };
  }

  throw new Error(
    "No content provided. Please paste text or select an uploaded file."
  );
}

/**
 * Turn a full Supabase public URL into a storage path.
 * e.g. https://xyz.supabase.co/storage/v1/object/public/study-materials/uid/file.pdf
 *  →  uid/file.pdf
 *
 * Also handles the case where only the path is supplied directly.
 */
function extractStoragePath(url: string): string {
  const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(bucketPrefix);

  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + bucketPrefix.length));
  }

  // Maybe the caller already passed a raw path (no URL prefix)
  if (!url.startsWith("http")) {
    return url;
  }

  // Try URL-based extraction as a last resort
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split(`/${BUCKET}/`);
    if (parts.length === 2) {
      return decodeURIComponent(parts[1]);
    }
  } catch {
    // not a valid URL
  }

  throw new Error("Could not determine storage path from the provided file URL.");
}
