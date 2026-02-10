"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload as UploadIcon,
  FileText,
  Loader2,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  File,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UploadRecord {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch("/api/uploads");
      if (res.ok) {
        const data = await res.json();
        setUploads(data);
      }
    } catch {
      // Silently fail on initial load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    // Client-side validation
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 10 MB.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "txt", "md", "docx"].includes(ext)) {
      setError("Unsupported file type. Please upload PDF, TXT, MD, or DOCX.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      setSuccess(`"${file.name}" uploaded successfully!`);
      setTimeout(() => setSuccess(null), 4000);
      await fetchUploads();
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset so user can re-select same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/uploads?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUploads((prev) => prev.filter((u) => u.id !== id));
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
      }
    } catch {
      setError("Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "text-red-400";
    if (ext === "txt" || ext === "md") return "text-blue-400";
    if (ext === "docx") return "text-indigo-400";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Upload Study Material</h2>
        <p className="text-muted-foreground mt-1">
          Upload PDFs, notes, or past papers. Then use any AI tool to process them.
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={`border-dashed border-2 bg-card/30 transition-colors cursor-pointer ${
          dragOver
            ? "border-neon-cyan bg-neon-cyan/5"
            : "border-border/50 hover:border-neon-cyan/40"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="h-16 w-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mb-4">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-neon-cyan animate-spin" />
            ) : (
              <UploadIcon className="h-8 w-8 text-neon-cyan" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {uploading ? "Uploading..." : "Drag & drop your files here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Supports PDF, TXT, MD, and DOCX files up to 10 MB. Your files are
            stored securely and only accessible by you.
          </p>
          {!uploading && (
            <Button variant="neon" className="gap-2" type="button">
              <FileText className="h-4 w-4" />
              Browse Files
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Uploads list */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Your Uploads</CardTitle>
          <CardDescription>
            {uploads.length} file{uploads.length !== 1 ? "s" : ""} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && uploads.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No uploads yet. Start by uploading your study material above.
            </p>
          )}

          {!loading && uploads.length > 0 && (
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/30 p-3 group hover:border-border/60 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                    <File className={`h-4 w-4 ${getFileIcon(upload.file_name)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {upload.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(upload.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(upload.id)}
                    disabled={deletingId === upload.id}
                  >
                    {deletingId === upload.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
