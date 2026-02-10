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
  Brain,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { UploadSelector } from "@/components/upload-selector";
import type { QuizQuestionData } from "@/types/study";

export default function QuizPage() {
  const [content, setContent] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const hasInput = !!selectedFileUrl || !!content.trim();

  const handleGenerate = async () => {
    if (!hasInput) { setError("Please enter study material or select an uploaded PDF."); return; }
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedAnswers({});
    setRevealed({});

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedFileUrl ? { fileUrl: selectedFileUrl } : { content: content.trim() }),
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setQuestions(data.questions ?? []);
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qi: number, option: string) => {
    if (revealed[qi]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qi]: option }));
  };

  const revealAnswer = (qi: number) => {
    setRevealed((prev) => ({ ...prev, [qi]: true }));
  };

  const score = Object.keys(revealed).length > 0
    ? Object.entries(revealed)
        .filter(([, v]) => v)
        .reduce((acc, [qi]) => {
          const q = questions[Number(qi)];
          return acc + (selectedAnswers[Number(qi)] === q?.correct_answer ? 1 : 0);
        }, 0)
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Quiz Generator</h2>
        <p className="text-muted-foreground mt-1">
          Auto-generate MCQs from your study material and test yourself.
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Study Material</CardTitle>
              <CardDescription>Paste content to generate quiz questions</CardDescription>
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
            rows={8}
            disabled={loading || !!selectedFileUrl}
            className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Questions:</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="rounded-md border border-border/50 bg-background/50 px-2 py-1 text-sm"
              >
                {[3, 5, 10, 15].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={loading || !hasInput} className="bg-neon-glow text-white hover:opacity-90 gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Quiz</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" /><p>{error}</p>
        </div>
      )}

      {/* Score banner */}
      {score !== null && Object.keys(revealed).length === questions.length && questions.length > 0 && (
        <div className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 p-4 flex items-center justify-between">
          <p className="text-sm font-medium">
            Score: <span className="text-neon-cyan text-lg font-bold">{score}/{questions.length}</span>
          </p>
          <Button variant="outline" size="sm" className="gap-2 border-border/50" onClick={() => { setSelectedAnswers({}); setRevealed({}); }}>
            <RotateCcw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const selected = selectedAnswers[qi];
        const isRevealed = revealed[qi];
        const isCorrect = selected === q.correct_answer;

        return (
          <Card key={qi} className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                <span className="text-neon-purple mr-2">Q{qi + 1}.</span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = selected === opt;
                const isCorrectOpt = opt === q.correct_answer;
                let optClass = "border-border/50 hover:border-neon-purple/40 cursor-pointer";
                if (isRevealed && isCorrectOpt) optClass = "border-green-500/50 bg-green-500/10";
                else if (isRevealed && isSelected && !isCorrect) optClass = "border-red-500/50 bg-red-500/10";
                else if (isSelected) optClass = "border-neon-purple/50 bg-neon-purple/10";

                return (
                  <button
                    key={opt}
                    onClick={() => selectAnswer(qi, opt)}
                    className={`w-full text-left rounded-lg border p-3 text-sm transition-colors flex items-center gap-2 ${optClass}`}
                  >
                    {isRevealed && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                    {isRevealed && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    <span>{opt}</span>
                  </button>
                );
              })}

              {selected && !isRevealed && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => revealAnswer(qi)}>
                  Check Answer
                </Button>
              )}

              {isRevealed && q.explanation && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span className="font-semibold text-foreground">Explanation:</span> {q.explanation}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
