"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import { UploadSelector } from "@/components/upload-selector";
import type { SummaryResponse } from "@/types";

export default function SummarizerPage() {
  const [content, setContent] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const hasInput = !!selectedFileUrl || !!content.trim();

  const handleSummarize = async () => {
    if (!hasInput) {
      setError("Please enter some study material or select an uploaded PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedFileUrl ? { fileUrl: selectedFileUrl } : { content: content.trim() }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data as SummaryResponse);
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    const text = [
      result.summary,
      "",
      "Key Points:",
      ...result.key_points.map((p) => `• ${p}`),
      "",
      "Topics:",
      result.topics.join(", "),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Summarizer</h2>
        <p className="text-muted-foreground mt-1">
          Paste your study material and get an AI-powered structured summary.
        </p>
      </div>

      {/* Input Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Study Material</CardTitle>
              <CardDescription>
                Paste notes, textbook excerpts, or any content you want summarized
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadSelector
            selectedFileUrl={selectedFileUrl}
            onSelect={(url, name) => {
              setSelectedFileUrl(url);
              setSelectedFileName(name);
            }}
            disabled={loading}
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={selectedFileUrl ? "File selected — textarea disabled" : "Paste your study material here..."}
            rows={10}
            disabled={loading || !!selectedFileUrl}
            className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selectedFileUrl
                ? `PDF selected: ${selectedFileName}`
                : `${content.length.toLocaleString()} / 50,000 characters`}
            </span>

            <Button
              onClick={handleSummarize}
              disabled={loading || !hasInput}
              className="bg-neon-glow text-white hover:opacity-90 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Summarizing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <Card className="border-neon-cyan/20 bg-card/50 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Summary</CardTitle>
                  <CardDescription>
                    Generated by Groq &middot; llama3-8b
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2 border-border/50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Overview */}
            {result.summary && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neon-cyan">
                  Overview
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {result.summary}
                </p>
              </div>
            )}

            {/* Key Points */}
            {result.key_points.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neon-purple">
                  Key Points
                </h3>
                <ul className="space-y-2">
                  {result.key_points.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-purple" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topics */}
            {result.topics.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neon-pink">
                  Topics Covered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-neon-pink/30 bg-neon-pink/10 px-3 py-1 text-xs font-medium text-neon-pink"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
