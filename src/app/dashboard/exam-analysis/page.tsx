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
import {
  BarChart3,
  Loader2,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { UploadSelector } from "@/components/upload-selector";
import type { DetectedTopicData } from "@/types/study";

interface ExamAnalysisResult {
  detected_topics: DetectedTopicData[];
  frequency_map: Record<string, number>;
}

export default function ExamAnalysisPage() {
  const [content, setContent] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamAnalysisResult | null>(null);

  const hasInput = !!selectedFileUrl || !!content.trim();

  const handleGenerate = async () => {
    if (!hasInput) { setError("Please enter exam/study content or select an uploaded PDF."); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/exam-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedFileUrl ? { fileUrl: selectedFileUrl } : { content: content.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setResult(data);
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const importanceColor: Record<string, string> = {
    high: "text-red-400 border-red-400/30 bg-red-400/10",
    medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    low: "text-green-400 border-green-400/30 bg-green-400/10",
  };

  const maxFreq = result
    ? Math.max(...result.detected_topics.map((t) => t.frequency), 1)
    : 1;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Exam Analysis</h2>
        <p className="text-muted-foreground mt-1">
          Detect repeated topics and patterns from past exam papers.
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Exam Content</CardTitle>
              <CardDescription>Paste past papers or study material to analyze topic patterns</CardDescription>
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
            placeholder={selectedFileUrl ? "File selected — textarea disabled" : "Paste past exam questions, papers, or syllabus here..."}
            rows={8}
            disabled={loading || !!selectedFileUrl}
            className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y disabled:opacity-50"
          />
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={loading || !hasInput} className="bg-neon-glow text-white hover:opacity-90 gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Analyze Topics</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" /><p>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && result.detected_topics.length > 0 && (
        <Card className="border-emerald-500/20 bg-card/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg">Topic Analysis</CardTitle>
            </div>
            <CardDescription>
              {result.detected_topics.length} topics detected — sorted by frequency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.detected_topics
              .sort((a, b) => b.frequency - a.frequency)
              .map((t, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.topic}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${importanceColor[t.importance] ?? importanceColor.medium}`}>
                        {t.importance}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      freq: {t.frequency}
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                      style={{ width: `${(t.frequency / maxFreq) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
