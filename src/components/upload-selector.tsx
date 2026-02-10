"use client";

import { FileUp, X, Loader2 } from "lucide-react";
import { useUserUploads } from "@/hooks/useUserUploads";

interface UploadSelectorProps {
  /** Currently selected file URL (controlled) */
  selectedFileUrl: string | null;
  /** Called when user picks or clears a file */
  onSelect: (fileUrl: string | null, fileName: string | null) => void;
  /** Optional: disable the selector */
  disabled?: boolean;
}

/**
 * Dropdown that lets the user pick one of their previously-uploaded files.
 * Designed to sit above or beside a textarea, providing an alternative to pasting text.
 */
export function UploadSelector({
  selectedFileUrl,
  onSelect,
  disabled = false,
}: UploadSelectorProps) {
  const { uploads, loading, error } = useUserUploads();

  // Only show PDFs (the extraction utility handles PDF only)
  const pdfUploads = uploads.filter((u) => {
    const name = (u.file_name ?? "").toLowerCase();
    return name.endsWith(".pdf");
  });

  const selectedName =
    pdfUploads.find((u) => u.file_url === selectedFileUrl)?.file_name ?? null;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <FileUp className="h-3.5 w-3.5" />
        Or select an uploaded PDF
      </label>

      <div className="flex items-center gap-2">
        <select
          value={selectedFileUrl ?? ""}
          disabled={disabled || loading}
          onChange={(e) => {
            const url = e.target.value || null;
            const name = url
              ? pdfUploads.find((u) => u.file_url === url)?.file_name ?? null
              : null;
            onSelect(url, name);
          }}
          className="flex-1 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">— None (use pasted text) —</option>
          {pdfUploads.map((u) => (
            <option key={u.id} value={u.file_url}>
              {u.file_name}
            </option>
          ))}
        </select>

        {selectedFileUrl && (
          <button
            type="button"
            onClick={() => onSelect(null, null)}
            disabled={disabled}
            className="rounded-md border border-border/50 p-2 text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!loading && pdfUploads.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No PDFs uploaded yet. Upload files from the{" "}
          <a href="/dashboard/upload" className="text-neon-cyan hover:underline">
            Upload page
          </a>
          .
        </p>
      )}

      {selectedName && (
        <p className="text-xs text-neon-cyan">
          Selected: <span className="font-medium">{selectedName}</span> — text
          will be extracted from this PDF.
        </p>
      )}
    </div>
  );
}
