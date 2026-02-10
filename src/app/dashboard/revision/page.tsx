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
  BookOpen,
  Loader2,
  Sparkles,
  AlertCircle,
  Lightbulb,
  CheckSquare,
} from "lucide-react";
import type { RevisionSectionData } from "@/types/study";

interface RevisionResult {
  revision_title: string;
  sections: RevisionSectionData[];
}

export default function RevisionPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RevisionResult | null>(null);

  const handleGenerate = async () => {
    if (!content.trim()) { setError("Please enter study material."); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Revision Mode</h2>
        <p className="text-muted-foreground mt-1">
          Get a condensed, exam-ready revision guide from your material.
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Study Material</CardTitle>
              <CardDescription>Paste content to generate a condensed revision guide</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your study material here..."
            rows={8}
            disabled={loading}
            className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y disabled:opacity-50"
          />
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={loading || !content.trim()} className="bg-neon-glow text-white hover:opacity-90 gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Revision Guide</>}
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
      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-neon-cyan">{result.revision_title}</h3>

          {result.sections.map((section, i) => (
            <Card key={i} className="border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                    {i + 1}
                  </span>
                  {section.heading}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Key Facts */}
                {section.key_facts?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neon-purple flex items-center gap-1.5">
                      <CheckSquare className="h-3 w-3" /> Key Facts
                    </h4>
                    <ul className="space-y-1">
                      {section.key_facts.map((fact, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-purple" />
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {section.tips && (
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/80">{section.tips}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
