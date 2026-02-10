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
  Sparkles,
  Loader2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { UploadSelector } from "@/components/upload-selector";
import type { StudyPlanTopicData } from "@/types/study";

interface StudyPlanResult {
  title: string;
  topics: StudyPlanTopicData[];
  estimated_hours: number;
}

export default function StudyPlansPage() {
  const [content, setContent] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudyPlanResult | null>(null);

  const hasInput = !!selectedFileUrl || !!content.trim();

  const handleGenerate = async () => {
    if (!hasInput) { setError("Please enter study material or select an uploaded PDF."); return; }
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedFileUrl ? { fileUrl: selectedFileUrl } : { content: content.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setPlan(data);
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const priorityColor: Record<string, string> = {
    high: "text-red-400 bg-red-400/10 border-red-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-green-400 bg-green-400/10 border-green-400/30",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Study Plans</h2>
        <p className="text-muted-foreground mt-1">
          Get a personalized, prioritized study schedule from your material.
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Study Material</CardTitle>
              <CardDescription>Paste content to generate a tailored study plan</CardDescription>
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
            placeholder={selectedFileUrl ? "File selected — textarea disabled" : "Paste your study material, syllabus, or topic list here..."}
            rows={8}
            disabled={loading || !!selectedFileUrl}
            className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y disabled:opacity-50"
          />
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={loading || !hasInput} className="bg-neon-glow text-white hover:opacity-90 gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Plan</>}
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
      {plan && (
        <Card className="border-neon-pink/20 bg-card/50 shadow-[0_0_15px_rgba(236,72,153,0.05)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{plan.title}</CardTitle>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                ~{plan.estimated_hours}h total
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.topics.map((t, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 bg-background/30 p-4 flex items-start gap-4"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 text-sm font-bold text-muted-foreground shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{t.topic}</h4>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityColor[t.priority] ?? priorityColor.medium}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {t.estimated_minutes} min
                  </p>
                  {t.resources?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.resources.map((r, ri) => (
                        <span key={ri} className="text-[11px] text-neon-cyan flex items-center gap-0.5">
                          <ArrowRight className="h-3 w-3" />{r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
